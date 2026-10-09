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
# Se pide un poco de mas porque el limitador siempre devuelve algo.
GANANCIA="$(echo "$OBJETIVO $ACTUAL" | awk '{printf "%.2f", $1 - $2 + 0.6}')"
echo "  medido:   ${ACTUAL} LUFS"
echo "  ganancia: ${GANANCIA} dB  (pareja, no comprime)"

# Techo del limitador, en escala lineal. Arranca con margen porque el AAC
# se pasa casi 2 dB al codificar.
TECHO=0.74

codificar() {
  ffmpeg -y -v error -i "$ENTRADA" \
    -af "volume=${GANANCIA}dB,alimiter=limit=${1}:attack=1.5:release=60:level=disabled" \
    -c:v copy -c:a aac -b:a 192k -movflags +faststart \
    "$SALIDA"
}

# Si el archivo ya codificado se pasa del techo, se baja el limitador y NO
# la ganancia: el limitador toca solo los picos, mientras que bajar la
# ganancia apagaria todo el video y lo dejaria por debajo del objetivo.
codificar "$TECHO"

for intento in 1 2 3; do
  PICO="$(medir_pico_real "$SALIDA")"
  SOBRA="$(echo "$PICO $PICO_MAXIMO" | awk '{print $1 - $2}')"
  if [ "$(echo "$SOBRA" | awk '{print ($1 > 0.05) ? 1 : 0}')" = "0" ]; then
    break
  fi
  TECHO="$(echo "$TECHO $SOBRA" | awk '{printf "%.4f", $1 * exp(-($2 + 0.2) * log(10) / 20)}')"
  echo "  pico real ${PICO} dBFS: se baja el limitador a ${TECHO}"
  codificar "$TECHO"
done

FINAL="$(medir_lufs "$SALIDA")"
PICO="$(medir_pico_real "$SALIDA")"

echo ""
echo "Listo: $SALIDA"
echo "  volumen:   ${FINAL} LUFS  (objetivo ${OBJETIVO})"
echo "  pico real: ${PICO} dBFS   (techo -1.0)"
