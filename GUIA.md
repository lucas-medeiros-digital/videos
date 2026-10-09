# Hacer videos con Claude Code + Remotion

Videos verticales (1080x1920, 30 fps) armados con código, sin abrir un editor de
video. Este repo ya viene configurado y con tres plantillas que funcionan.

---

## Paso 0 — Qué necesitás

| Cosa | Para qué | Cómo conseguirla |
|---|---|---|
| **Node.js LTS** | Remotion corre sobre Node | https://nodejs.org (bajá la versión LTS) |
| **Claude Code** | pedirle los cambios hablando | `npm i -g @anthropic-ai/claude-code`, después `claude` y entrás con tu cuenta Pro o Max |
| **Tu video crudo** | el material | un `.MOV` vertical grabado con el teléfono |
| **ffmpeg** *(opcional)* | preparar el video crudo | macOS: `brew install ffmpeg` · Linux: `sudo apt install ffmpeg` |

Comprobá que Node quedó bien:

```bash
node -v    # tiene que decir v20 o superior
npm -v
```

---

## Paso 1 — Bajar este proyecto

```bash
git clone https://github.com/lucas-medeiros-digital/videos.git
cd videos
npm install
```

`npm install` tarda un par de minutos la primera vez. La primera vez que
renderices, Remotion además descarga su propio navegador (unos 150 MB).

---

## Paso 2 — Ver las plantillas en el navegador

```bash
npm run studio
```

Se abre Remotion Studio en `http://localhost:3000`. En la barra de la izquierda
están las tres plantillas:

- **VideoConSubtitulos** — tu video con subtítulos palabra por palabra
- **IntroTitulo** — apertura con un título y dos logos
- **GraficoBarras** — barras que crecen con tus datos

Podés mover la línea de tiempo y cambiar los textos desde el panel de props, a la
derecha, sin tocar código. Es la forma más rápida de probar antes de renderizar.

---

## Paso 3 — Meter tu video

Copiá tu `.MOV` al proyecto. Si lo grabaste con un iPhone, pasalo por el script:
corrige el HDR, que es lo que hace que el video se vea lavado o demasiado claro
dentro del navegador.

```bash
./scripts/preparar-video.sh ~/Desktop/IMG_1234.MOV mi-video.mp4
```

Eso deja `public/mi-video.mp4` listo. Después, en `src/Root.tsx`, cambiá esta línea
de la composición `VideoConSubtitulos`:

```ts
archivoVideo: null,          // antes
archivoVideo: "mi-video.mp4" // después
```

Y ajustá la duración para que coincida con tu video:

```ts
durationInFrames: segundosAFrames(8),  // poné acá los segundos que dura
```

> Si no querés usar el script, podés copiar el archivo a `public/` a mano, pero un
> `.MOV` de iPhone va a salir con los colores raros.

---

## Paso 4 — Los subtítulos

Los tiempos viven en `src/datos/subtitulos.ts`, una palabra por línea:

```ts
{ texto: "Esto", desde: 0.0, hasta: 0.32 },
```

`desde` y `hasta` van en segundos. Escribirlos a mano para un reel de 30 segundos
es tedioso, así que hay dos atajos:

**Opción A — pedírselo a Claude Code.** Abrí `claude` en esta carpeta y decile:

> Transcribí `public/mi-video.mp4` y escribí los tiempos palabra por palabra en
> `src/datos/subtitulos.ts`, respetando el tipo `Palabra`.

**Opción B — Whisper local**, si querés que no salga del equipo:

```bash
npx @remotion/install-whisper-cpp
```

Después pedile a Claude Code que conecte la salida de Whisper al archivo de datos.

**Si quedan desfasados**, no toques los tiempos uno por uno. Usá el ajuste global:

```ts
ajusteSubtitulos: -0.2   // negativo los adelanta, positivo los atrasa
```

---

## Paso 5 — Renderizar

```bash
npm run render:subtitulos   # sale en salida/video-con-subtitulos.mp4
npm run render:intro
npm run render:grafico
```

O con tus propios valores, sin tocar el código:

```bash
npx remotion render IntroTitulo salida/mi-intro.mp4 \
  --props='{"titulo":"Mi título","subtitulo":"Mi bajada"}'
```

Los archivos quedan en `salida/`, que está fuera del control de versiones.

---

## Paso 6 — Pedir correcciones

Acá es donde esto se vuelve cómodo. Abrí `claude` en la carpeta y pedile los
cambios en castellano:

- «Hacé el título más grande y movelo 100 px para arriba»
- «Cambiá el rojo de acento por el verde #00C27A en todo el proyecto»
- «Agregá una transición de fundido de medio segundo entre la intro y el video»
- «Los subtítulos tapan la cara, subilos»

Claude edita los archivos y volvés a renderizar. Los primeros intentos casi nunca
salen bien al primer tiro: es normal, se ajusta hablando.

---

## Cómo está armado

```
src/
  formato.ts              Tamaño, fps y colores. Un solo lugar para cambiarlos.
  Root.tsx                Registra las tres composiciones y sus valores por defecto.
  datos/subtitulos.ts     Los tiempos palabra por palabra.
  componentes/
    Subtitulos.tsx        Resalta la palabra que se está diciendo.
  plantillas/
    VideoConSubtitulos.tsx
    IntroTitulo.tsx
    GraficoBarras.tsx
public/                   Tus videos y logos. Los videos no se suben al repo.
salida/                   Los .mp4 renderizados.
scripts/
  preparar-video.sh       HDR a SDR y .MOV a .mp4.
```

Para cambiar la identidad visual de todo de una vez, tocá `COLORES` en
`src/formato.ts`.

---

## Si algo falla

**`npx: command not found`**
Falta Node, o lo instalaste con la terminal abierta. Cerrala, abrí una nueva y
probá `node -v`.

**El video se ve lavado o muy claro**
Es HDR del iPhone. Pasalo por `./scripts/preparar-video.sh`.

**Los subtítulos van desfasados**
Movelos todos juntos con `ajusteSubtitulos` antes de corregirlos uno por uno.

**El video salió horizontal**
Las composiciones usan `FORMATO_VERTICAL` de `src/formato.ts`. Si le pedís un
cambio a Claude, aclarale siempre «vertical 1080x1920 a 30 fps», porque si no
tiende a asumir horizontal.

**`Error: Could not find Chrome` / no puede descargar el navegador**
Pasa en servidores sin salida a internet. Apuntá a un Chromium ya instalado:

```bash
REMOTION_BROWSER=/ruta/a/chrome npm run render:intro
```

**El render va muy lento**
Bajá la calidad mientras probás: `npx remotion render IntroTitulo salida/borrador.mp4 --crf=28`.

---

## De dónde sacar más plantillas

La galería de https://remotion.dev tiene prompts listos para pegarle a Claude
Code. Dos cosas al usarlos:

1. Elegí por **cómo se mueve**, no por el tema. Un prompt de un gráfico financiero
   te sirve igual para datos de tu negocio.
2. Reemplazá solamente los datos (textos, colores, logo, archivo) y dejá la
   estructura: escenas, tiempos y transiciones. Y cerrá siempre el pedido con
   «vertical 1080x1920 a 30 fps».

---

## El reel de Vínculo (audio y efectos sobre un video ya hecho)

La composición `ReelAgente` toma un video terminado y le agrega banda sonora y
efectos encima. Sirve de ejemplo de cómo trabajar sobre material que ya existe,
sin rehacer la animación.

```bash
npm run render:reel        # salida/reel-agente-final.mp4
npm run master:reel        # ajusta el volumen para redes
```

### Dónde se cambian los tiempos

Todo el reel se maneja desde **`src/guion.ts`**. Ahí está en qué frame pasa cada
cosa, medido cuadro por cuadro sobre el video original a 30 fps:

| Frame | Segundo | Qué pasa |
|---|---|---|
| 12 | 0,4 | cae el primer mensaje sin responder |
| 100 | 3,3 | arranca el riser, la cosa se descontrola |
| 126 | 4,2 | whoosh de entrada |
| **133** | **4,43** | **entra el agente** |
| 139 | 4,6 | el cartel termina de asentarse |
| 234 | 7,8 | el contador llega a cero |
| 237 | 7,9 | aparece el tilde verde |
| 303 | 10,1 | entra el titular |
| 393 | 13,1 | logo de Vínculo |
| 399 | 13,3 | botón Escribinos |

Los mismos números manejan el audio y los efectos, así que mover un momento
mueve las dos cosas juntas. Si reemplazás el video, estos son los únicos
valores que hay que volver a medir.

### Qué pasa cuando entra el agente

Seis cosas al mismo tiempo, en el frame 133:

- **Golpe de sonido**: sub que cae de 95 a 40 Hz, campana dorada y aire
- **Destello** dorado que tapa la pantalla y se va en 12 frames
- **Dos ondas expansivas** que salen desde el cartel
- **Sacudón de cámara** de 26 px que se apaga en medio segundo
- **Rebote de escala**: la imagen se achica un poco antes y rebota al entrar
- **Barrido de luz** en diagonal, seis frames después

Antes del golpe la viñeta se va cerrando y la cámara tiembla cada vez más; el
contraste es lo que hace que la entrada se sienta. En el audio pasa lo mismo:
la parte de la bronca está a -25 dB y el golpe a -11 dB.

### La banda sonora

No hay archivos descargados: todo se sintetiza con ffmpeg a partir de
osciladores y ruido, en `scripts/generar-audio.sh`.

```bash
./scripts/generar-audio.sh    # regenera public/audio/*.wav
```

Son tres camas musicales (tensión en La menor, resolución en Do mayor, cierre en
Fa mayor) y siete efectos. Para cambiar el carácter de la música, las notas
están escritas como frecuencias dentro del script.

### El volumen para redes

`scripts/masterizar.sh` deja el video en **-14 LUFS** con pico real **-1 dBTP**,
que es lo que esperan Instagram, TikTok y YouTube. Sin ese paso el reel se
escucha más bajo que el resto del feed.

Usa ganancia pareja y un limitador, no `loudnorm` en modo dinámico: ese
comprime todo el video parejo y el golpe del agente deja de destacar.
