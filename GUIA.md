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

## Los dos videos de Vínculo

Son dos versiones de la misma pieza. La larga **empieza con el reel corto tal
cual** y sigue a partir del titular; por eso el reel se corta en el frame 390,
cuando ya pasó «Ninguna consulta se te escapa» y todavía no apareció el logo.

```bash
npm run render:corto    # 15,5 s — salida/reel-corto.mp4
npm run render:largo    # 44,8 s — salida/reel-largo.mp4
npm run master salida/reel-corto.mp4 salida/reel-corto-master.mp4
```

| Composición | Qué es |
|---|---|
| `ReelAgente` | El reel original con efectos y diseño de sonido. |
| `ReelLargo` | El mismo arranque, y después: los cuatro pasos de puesta en marcha y una sola pantalla con el antes y el después. |

`ReelAgente.tsx` exporta las dos piezas por separado — `ReelVisual` (el video
con los efectos, con un `hasta` para cortarlo antes) y `AudioReel` (los
sonidos) — así la versión larga reusa exactamente el mismo arranque en vez de
tener una copia.

### Dónde se cambian los tiempos

Todo en **`src/guion.ts`**, medido cuadro por cuadro sobre el video original:

| Frame | Segundo | Qué pasa |
|---|---|---|
| 0–94 | 0–3,1 | caen los mensajes, en grilla de 9 frames |
| 105 | 3,5 | arranca el barrido |
| **133** | **4,43** | **entra el agente** |
| 145–166 | 4,8–5,5 | el agente despeja la bandeja |
| 234 | 7,8 | el contador llega a cero |
| 237 | 7,9 | aparece el tilde verde |
| 303 | 10,1 | entra el titular |
| 390 | 13,0 | hasta acá llega el reel dentro de la versión larga |

Los textos de la versión larga (`PASOS`, `HOY`, `CON_AGENTE`) están en arreglos
arriba de `ReelLargo.tsx`.

### Qué pasa cuando entra el agente

- **Sonido**: chasquido que define el instante, sub contenido de 78 a 44 Hz y
  dos campanas FM en quinta justa, con 2,2 s de cola
- **Destello** dorado que se va en 12 frames
- **Dos ondas expansivas** desde el cartel
- **Asentamiento de cámara** de 3,5 px, nueve frames
- **Barrido de luz** en diagonal

La cámara **no tiembla** antes: los mensajes son lo que hay que leer. El
contraste lo hace el audio, que salta 8 dB sobre todo lo demás.

> Cuidado con `extrapolateLeft: "clamp"` en `interpolate`: devuelve el **primer**
> valor del rango, no cero. Sin un guardia explícito, un efecto pensado para el
> frame 133 se aplica también a todos los frames anteriores.

> Y con `<Sequence>`: adentro, `useCurrentFrame()` devuelve el frame **local**.
> Como todos los tiempos están en frames globales, mezclarlos deja las escenas
> vacías sin ningún error. Por eso se usa `<Escena desde={} hasta={}>`.

### El diseño de sonido

```bash
npm run sonido    # regenera public/audio/
```

`scripts/sintetizador.mjs` es un sintetizador chico sin dependencias:
osciladores, ADSR, filtros biquad, campanas FM y una reverb de placa. Cuatro
decisiones ordenan toda la paleta:

- **Tres capas por efecto**: transitorio, cuerpo y cola. Un sonido de una sola
  capa suena barato por bueno que sea el timbre.
- **Reverb con pre-delay.** El hueco de 12 a 26 ms entre el sonido y su cola es
  lo que deja escuchar el espacio en vez de empastar.
- **Ancho estéreo por Haas**, no por paneo: el mismo sonido corrido unos
  milisegundos se percibe ancho, no como dos sonidos.
- La tensión se construye con **ritmo y silencio**, nunca con volumen.

| Sonido | Dónde |
|---|---|
| `notificacion-1/2/3` (+ `-acento`) | Cada consulta que llega. |
| `barrido` | La subida que anuncia al agente. |
| `activacion` | El agente. Chasquido, sub, campanas en quinta y cola larga. |
| `clic` · `confirmacion` | El agente trabajando. Táctiles y al fondo. |
| `logro` | Cero consultas. Cristalino arriba, cálido abajo. |
| `marca` | El cierre: una subida y una nota que resuelve. |

**Las notificaciones** son un toque corto y seco, no una campana: chasquido,
cuerpo de madera que cae de tono y una chispa aguda. Suenan 26 veces en cuatro
segundos, así que cada una tiene que ser breve y sin cola — lo que se acumula
es el ritmo, no el sonido.

Su patrón está en `NOTIFICACIONES`, en `src/guion.ts`. Las cinco primeras van
clavadas sobre las burbujas del video; a partir de ahí se despegan y los huecos
se achican **de 9 a 2 frames**, hasta que dejan de leerse como golpes sueltos y
se vuelven una textura. Las que coinciden con una burbuja llevan algo de grave
y suenan con más cuerpo: así destacan sin subir de volumen.

### La música

`musica-corta.wav` (16 s) y `musica-larga.wav` (46 s), las dos del mismo
material y con el mismo arranque.

Va **debajo de todo**, al 50%: sostiene, no compite. El arco armónico sigue al
video:

| Tramo | Acorde | Por qué |
|---|---|---|
| Se acumulan las consultas | Do **suspendido** | No es mayor ni menor: no resuelve, y esa falta de resolución es la tensión. |
| Entra el agente | Do mayor | Resuelve, se abre el filtro y entra el sub. |
| El titular | Fa mayor | Más cálido, deja respirar. |
| Los pasos (larga) | La · Fa · Do · Sol | Una vuelta por paso, el motivo sostiene. |
| El cierre | Do mayor con novena | La novena es lo que le da el brillo. |

Dos cosas hacen que no suene a sintetizador barato. El pad son **tres sierras
por nota apenas desafinadas** entre sí: entran y salen de fase lentamente y el
sonido respira. Y hay un **motivo de cinco notas** (C–E–G–E–D) que vuelve en
cada escena que hay que sostener: es lo único que se recuerda de la música, así
que no cambia nunca.

### El volumen para redes

`scripts/masterizar.sh` deja los videos a **-14 LUFS** con pico real bajo
**-1 dBTP**. Corrige volumen y pico **juntos**, en un lazo sobre el archivo ya
codificado:

- Se pisan entre sí: el limitador baja los picos y de paso baja el volumen, así
  que corregirlos por separado deja el video saturado o bajo.
- Se mide después de codificar porque el **AAC se pasa casi 2 dB** respecto de
  lo que entra.
- Cada perilla hace una cosa: la ganancia mueve el volumen, el techo del
  limitador mueve el pico. Nunca al revés: bajar la ganancia para domar un pico
  apaga todo el video.
