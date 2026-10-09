#!/usr/bin/env bash
# Deja el audio del render al volumen que esperan Instagram, TikTok y YouTube
# (-14 LUFS, pico real -1 dBTP) SIN aplastar la dinamica.
#
# Por que no usa loudnorm: en modo dinamico comprime todo el reel y el golpe
# del agente deja de destacar. Aca se aplica una ganancia fija, que no cambia
# las diferencias entre partes, y un limitador que solo atrapa los picos.
#
# Uso: ./scripts/masterizar.sh salida/reel.mp4 [salida.mp4]

set -euo pipefail

ENTRADA="${1:?Uso: $0 <video-de-entrada> [video-de-salida]}"
SALIDA="${2:-${ENTRADA%.mp4}-master.mp4}"
OBJETIVO=-14.0

if [ ! -f "$ENTRADA" ]; then
  echo "No encuentro el archivo: $ENTRADA" >&2
  exit 1
fi

medir_lufs() {
  ffmpeg -hide_banner -i "$1" -af ebur128=framelog=quiet -f null - 2>&1 \
    | grep -A1 "Integrated loudness" | grep -oE "\-?[0-9]+\.[0-9]+" | head -1
}

ACTUAL="$(medir_lufs "$ENTRADA")"
# Se pide un poco de mas porque el limitador siempre devuelve algo.
GANANCIA="$(echo "$OBJETIVO $ACTUAL" | awk '{printf "%.2f", $1 - $2 + 0.6}')"

echo "  medido:   ${ACTUAL} LUFS"
echo "  ganancia: ${GANANCIA} dB  (pareja, no comprime)"

ffmpeg -y -v error -i "$ENTRADA" \
  -af "volume=${GANANCIA}dB,alimiter=limit=0.84:attack=1.5:release=60:level=disabled" \
  -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  "$SALIDA"

FINAL="$(medir_lufs "$SALIDA")"
PICO="$(ffmpeg -hide_banner -i "$SALIDA" -af ebur128=peak=true:framelog=quiet -f null - 2>&1 \
  | grep -A1 "True peak" | grep -oE "\-?[0-9]+\.[0-9]+" | head -1)"

echo ""
echo "Listo: $SALIDA"
echo "  volumen:   ${FINAL} LUFS  (objetivo ${OBJETIVO})"
echo "  pico real: ${PICO} dBFS   (techo -1.0)"
