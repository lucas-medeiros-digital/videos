#!/usr/bin/env bash
# Sintetiza los EFECTOS del reel con ffmpeg: no descarga nada, todo sale
# de osciladores y ruido.
#
# La musica y el golpe del agente no se hacen aca sino en
# scripts/generar-musica.mjs, que es un sintetizador con envolventes y
# filtros: para eso las expresiones de ffmpeg se vuelven inmanejables.
#
# Los tiempos en los que suena cada pieza estan en src/guion.ts.
#
# Uso: ./scripts/generar-audio.sh

set -euo pipefail

DESTINO="public/audio"
mkdir -p "$DESTINO"

crear() {
  local nombre="$1"; shift
  ffmpeg -y -v error "$@" -ac 2 -ar 48000 "$DESTINO/$nombre"
  echo "  $nombre"
}

echo "Generando efectos..."

# --- Mensaje que llega: click corto y seco, con cola grave que cae ---
crear tic.wav -f lavfi -i "aevalsrc='
  0.50*exp(-40*t)*sin(2*PI*(980*t-1500*t*t))
  +0.20*exp(-130*t)*(random(0)*2-1)
  |0.50*exp(-40*t)*sin(2*PI*(965*t-1480*t*t))
  +0.20*exp(-130*t)*(random(1)*2-1)':d=0.16:s=48000" \
  -af "highpass=f=180,alimiter=limit=0.9"

# --- Mensaje resuelto: aire corto, sin golpe ---
crear swish.wav -f lavfi -i "anoisesrc=d=0.28:c=pink:a=0.7:r=48000" \
  -af "highpass=f=1800,volume='pow(1-t/0.28,1.8)':eval=frame,afade=t=in:st=0:d=0.02,alimiter=limit=0.7"

# --- Whoosh previo al agente: entra barriendo ---
crear whoosh.wav -f lavfi -i "anoisesrc=d=0.6:c=pink:a=0.9:r=48000" \
  -f lavfi -i "aevalsrc='0.35*pow(t/0.6,2.5)*sin(2*PI*(260*t+900*t*t))|0.35*pow(t/0.6,2.5)*sin(2*PI*(258*t+890*t*t))':d=0.6:s=48000" \
  -filter_complex "[0:a]bandpass=f=1500:width_type=h:w=1800,volume='pow(t/0.6,2.6)':eval=frame[n];
                   [n][1:a]amix=inputs=2:weights=1 0.8:normalize=0,afade=t=out:st=0.52:d=0.08,alimiter=limit=0.85"

# --- Riser: la tension que se acumula antes de que entre el agente ---
crear riser.wav -f lavfi -i "anoisesrc=d=1.6:c=white:a=0.6:r=48000" \
  -f lavfi -i "aevalsrc='0.30*pow(t/1.6,2.2)*sin(2*PI*(300*t+620*t*t))|0.30*pow(t/1.6,2.2)*sin(2*PI*(297*t+615*t*t))':d=1.6:s=48000" \
  -filter_complex "[0:a]highpass=f=900,volume='pow(t/1.6,3)*0.8':eval=frame[n];
                   [n][1:a]amix=inputs=2:weights=1 1:normalize=0,alimiter=limit=0.82"

# --- Cero consultas: confirmacion de dos notas que suben ---
crear check.wav -f lavfi -i "aevalsrc='
  exp(-5.5*t)*0.38*sin(2*PI*659.25*t)
  |exp(-5.5*t)*0.38*sin(2*PI*661*t)':d=1.5:s=48000" \
  -f lavfi -i "aevalsrc='
  exp(-4.5*t)*(0.34*sin(2*PI*987.77*t)+0.14*sin(2*PI*1975.5*t))
  |exp(-4.5*t)*(0.34*sin(2*PI*990*t)+0.14*sin(2*PI*1980*t))':d=1.5:s=48000" \
  -filter_complex "[1:a]adelay=130|130[segunda];
                   [0:a][segunda]amix=inputs=2:weights=1 1:normalize=0,
                   aecho=0.9:0.8:200|400:0.25|0.16,alimiter=limit=0.8"

# --- Boton Escribinos: pop corto y redondo ---
crear pop.wav -f lavfi -i "aevalsrc='
  0.55*exp(-17*t)*sin(2*PI*(520*t+140*t*t))+0.18*exp(-90*t)*(random(0)*2-1)
  |0.55*exp(-17*t)*sin(2*PI*(516*t+138*t*t))+0.18*exp(-90*t)*(random(1)*2-1)':d=0.4:s=48000" \
  -af "highpass=f=150,alimiter=limit=0.8"

echo ""
echo "Listo. Las camas musicales y el golpe del agente los genera"
echo "scripts/generar-musica.mjs, que es un sintetizador aparte."
echo ""
echo "Efectos en $DESTINO/:"
for f in tic swish whoosh riser check pop; do
  printf "  %-26s %5.2fs\n" "$f.wav" \
    "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DESTINO/$f.wav")"
done
