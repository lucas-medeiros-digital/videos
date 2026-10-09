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
PICO_MAXIMO=-1.0

if [ ! -f "$ENTRADA" ]; then
  echo "No encuentro el archivo: $ENTRADA" >&2
  exit 1
fi

medir_lufs() {
  ffmpeg -hide_banner -i "$1" -af ebur128=framelog=quiet -f null - 2>&1 \
    | grep -A1 "Integrated loudness" | grep -oE "\-?[0-9]+\.[0-9]+" | head -1
}

medir_pico_real() {
  ffmpeg -hide_banner -i "$1" -af "${2:-anull},ebur128=peak=true:framelog=quiet" -f null - 2>&1 \
    | grep -A1 "True peak" | grep -oE "\-?[0-9]+\.[0-9]+" | head -1
}

ACTUAL="$(medir_lufs "$ENTRADA")"
GANANCIA="$(echo "$OBJETIVO $ACTUAL" | awk '{printf "%.2f", $1 - $2 + 0.6}')"
TECHO=0.74   # techo del limitador, con margen porque el AAC se pasa al codificar

echo "  medido: ${ACTUAL} LUFS"

codificar() {
  ffmpeg -y -v error -i "$ENTRADA" \
    -af "volume=${GANANCIA}dB,alimiter=limit=${TECHO}:attack=1.5:release=60:level=disabled" \
    -c:v copy -c:a aac -b:a 192k -movflags +faststart \
    "$SALIDA"
}

# Volumen y pico se corrigen juntos, sobre el archivo ya codificado.
#
# Van juntos porque se pisan: el limitador baja los picos y de paso baja
# el volumen general, asi que corregirlos por separado deja el video o
# saturado o bajo. Y se mide despues de codificar porque el AAC se pasa
# casi 2 dB respecto de lo que entra.
#
# Cada perilla hace una cosa: la ganancia mueve el volumen, el techo del
# limitador mueve el pico.
for intento in 1 2 3 4; do
  codificar

  LUFS="$(medir_lufs "$SALIDA")"
  PICO="$(medir_pico_real "$SALIDA")"
  FALTA="$(echo "$OBJETIVO $LUFS" | awk '{printf "%.2f", $1 - $2}')"
  SOBRA="$(echo "$PICO $PICO_MAXIMO" | awk '{printf "%.2f", $1 - $2}')"

  LISTO="$(echo "$FALTA $SOBRA" | awk '{print (($1 < 0.4 && $1 > -0.4) && $2 <= 0.05) ? 1 : 0}')"
  [ "$LISTO" = "1" ] && break

  echo "  intento ${intento}: ${LUFS} LUFS, pico ${PICO} dBFS"
  if [ "$(echo "$SOBRA" | awk '{print ($1 > 0.05) ? 1 : 0}')" = "1" ]; then
    TECHO="$(echo "$TECHO $SOBRA" | awk '{printf "%.4f", $1 * exp(-($2 + 0.2) * log(10) / 20)}')"
  fi
  if [ "$(echo "$FALTA" | awk '{print ($1 > 0.4 || $1 < -0.4) ? 1 : 0}')" = "1" ]; then
    GANANCIA="$(echo "$GANANCIA $FALTA" | awk '{printf "%.2f", $1 + $2}')"
  fi
done

FINAL="$(medir_lufs "$SALIDA")"
PICO="$(medir_pico_real "$SALIDA")"

echo ""
echo "Listo: $SALIDA"
echo "  volumen:   ${FINAL} LUFS  (objetivo ${OBJETIVO})"
echo "  pico real: ${PICO} dBFS   (techo -1.0)"
