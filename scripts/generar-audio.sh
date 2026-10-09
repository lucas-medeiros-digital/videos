#!/usr/bin/env bash
# Sintetiza la banda sonora del reel con ffmpeg: no usa librerias externas
# ni descarga nada, todo se genera a partir de osciladores y ruido.
#
# Cada archivo es una pieza suelta. Los tiempos en los que suena cada una
# estan en src/guion.ts, no aca.
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

# --- EL MOMENTO: entra el agente. Sub que cae + campana dorada + cuerpo ---
crear impacto-agente.wav -f lavfi -i "aevalsrc='
  0.95*exp(-3.2*t)*sin(2*PI*(95*t-27*t*t))
  |0.95*exp(-3.2*t)*sin(2*PI*(94*t-26.7*t*t))':d=2.4:s=48000" \
  -f lavfi -i "aevalsrc='
  exp(-3.4*t)*(0.42*sin(2*PI*880*t)+0.26*sin(2*PI*1320*t)+0.17*sin(2*PI*1760*t)+0.10*sin(2*PI*2640*t))
  |exp(-3.4*t)*(0.42*sin(2*PI*884*t)+0.26*sin(2*PI*1326*t)+0.17*sin(2*PI*1768*t)+0.10*sin(2*PI*2652*t))':d=2.4:s=48000" \
  -f lavfi -i "anoisesrc=d=0.5:c=white:a=0.8:r=48000" \
  -filter_complex "[2:a]highpass=f=2500,volume='exp(-26*t)':eval=frame[aire];
                   [1:a]aecho=0.9:0.75:170|330:0.28|0.18[campana];
                   [0:a][campana][aire]amix=inputs=3:weights=1 0.75 0.5:normalize=0,
                   alimiter=limit=0.95"

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

echo "Generando camas musicales..."

# --- Cama 1: la bronca de las consultas sin responder. La menor, va subiendo ---
crear cama-tension.wav -f lavfi -i "aevalsrc='
  0.22*sin(2*PI*110*t)+0.15*sin(2*PI*130.81*t)+0.12*sin(2*PI*164.81*t)+0.07*sin(2*PI*220*t)
  |0.22*sin(2*PI*110.3*t)+0.15*sin(2*PI*131.1*t)+0.12*sin(2*PI*165.2*t)+0.07*sin(2*PI*220.6*t)':d=4.8:s=48000" \
  -af "lowpass=f=950,tremolo=f=0.7:d=0.22,
       volume='0.30+0.70*pow(t/4.8,1.7)':eval=frame,
       aecho=0.85:0.8:300|560:0.3|0.2,
       afade=t=in:st=0:d=0.4,afade=t=out:st=4.5:d=0.3,alimiter=limit=0.8"

# --- Cama 2: el agente trabajando. Do mayor, con pulso parejo ---
crear cama-resolucion.wav -f lavfi -i "aevalsrc='
  0.20*sin(2*PI*130.81*t)+0.14*sin(2*PI*196*t)+0.11*sin(2*PI*261.63*t)+0.08*sin(2*PI*329.63*t)
  |0.20*sin(2*PI*131.1*t)+0.14*sin(2*PI*196.4*t)+0.11*sin(2*PI*262.2*t)+0.08*sin(2*PI*330.3*t)':d=5.9:s=48000" \
  -af "lowpass=f=2600,tremolo=f=2:d=0.45,
       volume='0.55+0.45*pow(min(t/1.2,1),1.4)':eval=frame,
       aecho=0.85:0.75:260|480:0.26|0.18,
       afade=t=in:st=0:d=0.25,afade=t=out:st=5.5:d=0.4,alimiter=limit=0.8"

# --- Cama 3: el cierre de marca. Fa mayor, calido, con cola larga ---
crear cama-final.wav -f lavfi -i "aevalsrc='
  0.20*sin(2*PI*174.61*t)+0.15*sin(2*PI*220*t)+0.12*sin(2*PI*261.63*t)+0.09*sin(2*PI*349.23*t)
  |0.20*sin(2*PI*174.9*t)+0.15*sin(2*PI*220.5*t)+0.12*sin(2*PI*262.2*t)+0.09*sin(2*PI*350*t)':d=5.6:s=48000" \
  -af "lowpass=f=2200,
       volume='0.45+0.55*pow(min(t/2.4,1),1.2)':eval=frame,
       aecho=0.85:0.8:340|620:0.32|0.24,
       afade=t=in:st=0:d=0.5,afade=t=out:st=4.6:d=1.0,alimiter=limit=0.8"

echo ""
echo "Listo. Archivos en $DESTINO/:"
for f in "$DESTINO"/*.wav; do
  printf "  %-26s %5.2fs\n" "$(basename "$f")" \
    "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"
done
