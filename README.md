# videos

Videos verticales (1080x1920, 30 fps) hechos con [Remotion](https://remotion.dev)
y Claude Code, sin editor de video.

```bash
npm install
npm run studio          # previsualizar en el navegador
npm run render:intro    # renderizar a salida/
```

**El paso a paso completo está en [GUIA.md](./GUIA.md).**

## Plantillas

| Composición | Qué hace |
|---|---|
| `ReelAgente` | El reel de Vínculo con banda sonora y efectos encima |
| `VideoConSubtitulos` | Tu video del teléfono con subtítulos palabra por palabra |
| `IntroTitulo` | Apertura con título y dos logos |
| `GraficoBarras` | Barras animadas con tus datos |

## Comandos

```bash
npm run studio              # Remotion Studio en localhost:3000
npm run render:reel         # salida/reel-agente-final.mp4
npm run master:reel         # ajusta el volumen a -14 LUFS para redes
npm run render:subtitulos   # salida/video-con-subtitulos.mp4
npm run render:intro        # salida/intro.mp4
npm run render:grafico      # salida/grafico.mp4
npm run typecheck           # verificar tipos

./scripts/preparar-video.sh <entrada.MOV> <salida.mp4>   # HDR a SDR, a public/
./scripts/generar-audio.sh                              # sintetiza public/audio/*.wav
./scripts/masterizar.sh <video.mp4>                     # volumen para redes
```

Las skills de Remotion están instaladas en `.agents/skills/` (y enlazadas desde
`.claude/skills/`), así que Claude Code ya tiene el contexto del framework.
