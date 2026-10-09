import React from "react";
import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { MENSAJES_RESUELTOS, MOMENTO, NOTIFICACIONES, REEL } from "../guion";
import {
  BarridoLuz,
  Chispa,
  Destello,
  OndaExpansiva,
  Resplandor,
  Vineta,
  sacudida,
} from "../componentes/efectos";

/** Donde aparece el cartel "Entra tu agente de WhatsApp", en pixeles. */
const CARTEL = { x: 540, y: 554 };
/** Donde esta el contador con el tilde verde. */
const CONTADOR = { x: 580, y: 150 };
/** Donde cae el logo y el boton del cierre. */
const LOGO = { x: 540, y: 820 };
const BOTON = { x: 540, y: 960 };

const sonido = (nombre: string) => staticFile(`audio/${nombre}`);

/**
 * El reel: el video original con los efectos encima, sin audio.
 *
 * `hasta` permite cortarlo antes del final, que es lo que hace la version
 * larga: usa el reel hasta despues del titular y sigue con sus propias
 * escenas, en vez de cerrar con el logo a los 15 segundos.
 */
export const ReelVisual: React.FC<{ hasta?: number }> = ({
  hasta = REEL.duracionFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame >= hasta) {
    return null;
  }

  // --- Camara ---------------------------------------------------------
  // Un asentamiento minimo al entrar el agente, nada mas. Cualquier
  // temblor mayor, o sostenido antes del golpe, vuelve ilegibles los
  // mensajes que son justamente lo que hay que leer.
  // Ojo con el guardia de abajo: `extrapolateLeft: "clamp"` devuelve el
  // PRIMER valor del rango, no cero, asi que sin el la sacudida se aplica
  // tambien a todos los frames anteriores al golpe.
  const asentamiento =
    frame < MOMENTO.agenteEntra
      ? 0
      : interpolate(
          frame,
          [MOMENTO.agenteEntra, MOMENTO.agenteEntra + 9],
          [3.5, 0],
          { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
        );
  const temblor = sacudida(frame, asentamiento);

  // Toma aire justo antes del golpe y despues rebota hasta su tamano normal.
  const anticipacion = interpolate(
    frame,
    [MOMENTO.agenteEntra - 7, MOMENTO.agenteEntra],
    [1, 0.992],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const rebote =
    frame >= MOMENTO.agenteEntra
      ? 1 +
        0.045 *
          (1 -
            spring({
              frame: frame - MOMENTO.agenteEntra,
              fps,
              config: { damping: 12, mass: 0.45 },
            }))
      : 1;
  const escala = anticipacion * rebote;

  const vineta = interpolate(
    frame,
    [MOMENTO.primerMensaje, MOMENTO.agenteEntra - 5, MOMENTO.agenteEntra + 8],
    [0, 0.34, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0E2A20" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${temblor.x}px, ${temblor.y}px) rotate(${temblor.giro}deg) scale(${escala})`,
        }}
      >
        <Video
          src={staticFile(REEL.archivo)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <Vineta fuerza={vineta} />

      {/* --- La entrada del agente ------------------------------------ */}
      <Resplandor
        frame={frame}
        desde={MOMENTO.agenteEntra}
        hasta={MOMENTO.agenteEntra + 48}
        x={CARTEL.x}
        y={CARTEL.y}
      />
      <Destello frame={frame} desde={MOMENTO.agenteEntra} />
      <OndaExpansiva
        frame={frame}
        desde={MOMENTO.agenteEntra}
        x={CARTEL.x}
        y={CARTEL.y}
      />
      <OndaExpansiva
        frame={frame}
        desde={MOMENTO.agenteEntra + 6}
        x={CARTEL.x}
        y={CARTEL.y}
        duracion={36}
      />
      <BarridoLuz frame={frame} desde={MOMENTO.agenteAterriza} />

      {/* --- Cero consultas, logo y boton ----------------------------- */}
      <Chispa
        frame={frame}
        desde={MOMENTO.check}
        x={CONTADOR.x}
        y={CONTADOR.y}
        color="#7BC67E"
        radio={200}
      />
      <Chispa
        frame={frame}
        desde={MOMENTO.logo}
        x={LOGO.x}
        y={LOGO.y}
        radio={420}
        duracion={30}
      />
      <Chispa
        frame={frame}
        desde={MOMENTO.boton}
        x={BOTON.x}
        y={BOTON.y}
        radio={200}
        duracion={18}
      />

    </AbsoluteFill>
  );
};

/**
 * Los sonidos del reel, alineados con lo que pasa en pantalla.
 *
 * La musica va aparte, abajo de todo esto: aca manda el diseño de
 * sonido y la musica solo sostiene.
 */
export const AudioReel: React.FC<{ conCierre?: boolean }> = ({
  conCierre = true,
}) => (
  <>
    {/* Las consultas que se acumulan. Van acelerando de 9 a 2 frames de
        separacion: al final dejan de leerse como golpes sueltos y se
        vuelven una textura. Tres timbres alternados, porque repetir uno
        solo veintiseis veces suena a maquina. */}
    {NOTIFICACIONES.map(([f, acento], i) => (
      <Audio
        key={`n-${f}`}
        src={sonido(`notificacion-${(i % 3) + 1}${acento ? "-acento" : ""}.wav`)}
        from={f}
        // Suben apenas: la presion la hace la densidad, no el volumen.
        volume={0.46 + 0.22 * (i / (NOTIFICACIONES.length - 1))}
      />
    ))}

    {/* La aparicion del agente. */}
    <Audio src={sonido("barrido.wav")} from={MOMENTO.barrido} volume={0.6} />
    <Audio src={sonido("activacion.wav")} from={MOMENTO.agenteEntra} volume={0.95} />

    {/* El agente trabajando: un clic por mensaje resuelto. */}
    {MENSAJES_RESUELTOS.map((f) => (
      <Audio key={`c-${f}`} src={sonido("clic.wav")} from={f} volume={0.6} />
    ))}

    {/* Cero consultas. */}
    <Audio src={sonido("logro.wav")} from={MOMENTO.check} volume={0.78} />

    {conCierre ? (
      <Audio src={sonido("marca.wav")} from={MOMENTO.marca} volume={0.8} />
    ) : null}
  </>
);

/** El reel corto, de punta a punta. */
export const ReelAgente: React.FC = () => (
  <>
    <ReelVisual />
    <AudioReel />
    {/* Debajo de todo: sostiene sin competir con los efectos. */}
    <Audio src={sonido("musica-corta.wav")} volume={0.5} />
  </>
);
