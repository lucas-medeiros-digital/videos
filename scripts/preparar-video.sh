#!/usr/bin/env bash
# Prepara el video crudo del telefono para usarlo en Remotion.
#
#   - Convierte HDR (el iPhone graba asi) a SDR BT.709, que es lo que
#     entiende el navegador. Sin esto el video sale lavado o muy claro.
#   - Pasa de .MOV a .mp4 con H.264, que Remotion reproduce mas rapido.
#   - Deja el archivo en public/, que es donde la plantilla lo busca.
#
# Uso:
#   ./scripts/preparar-video.sh ~/Desktop/IMG_1234.MOV mi-video.mp4

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <video-de-entrada> [nombre-de-salida.mp4]" >&2
  exit 1
fi

ENTRADA="$1"
SALIDA="public/${2:-video.mp4}"

if [ ! -f "$ENTRADA" ]; then
  echo "No encuentro el archivo: $ENTRADA" >&2
  exit 1
fi

mkdir -p public

# Detecta si el material viene en HDR mirando la curva de transferencia.
TRANSFERENCIA="$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=color_transfer -of default=nw=1:nk=1 "$ENTRADA" || true)"

if [ "$TRANSFERENCIA" = "arib-std-b67" ] || [ "$TRANSFERENCIA" = "smpte2084" ]; then
  echo "Video HDR detectado ($TRANSFERENCIA). Convirtiendo a SDR BT.709..."
  FILTRO="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
else
  echo "Video SDR. Solo se normaliza el formato de color."
  FILTRO="format=yuv420p"
fi

ffmpeg -y -i "$ENTRADA" \
  -vf "$FILTRO" \
  -c:v libx264 -preset slow -crf 18 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$SALIDA"

echo ""
echo "Listo: $SALIDA"
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,duration \
  -of default=nw=1 "$SALIDA"
echo ""
echo "Ahora en src/Root.tsx pone archivoVideo: \"${2:-video.mp4}\""
