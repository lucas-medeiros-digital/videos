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
import { MOMENTO, REEL, SWISHES_RESUELTOS, TICS_MENSAJES } from "../guion";
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
 * El reel ya terminado, con la banda sonora y los efectos que remarcan
 * la entrada del agente.
 */
export const ReelAgente: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camara ---------------------------------------------------------
  // Tiembla cada vez mas mientras se amontonan los mensajes...
  const tension = interpolate(frame, [MOMENTO.primerMensaje, MOMENTO.agenteEntra], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  // ...y pega un sacudon seco cuando entra el agente.
  const golpe = interpolate(
    frame,
    [MOMENTO.agenteEntra, MOMENTO.agenteEntra + 14],
    [26, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );
  const temblor = sacudida(frame, Math.max(tension, golpe));

  // Toma aire justo antes del golpe y despues rebota hasta su tamano normal.
  const anticipacion = interpolate(
    frame,
    [MOMENTO.agenteEntra - 7, MOMENTO.agenteEntra],
    [1, 0.985],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const rebote =
    frame >= MOMENTO.agenteEntra
      ? 1 +
        0.075 *
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
    [0, 0.55, 0],
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

      {/* --- Banda sonora --------------------------------------------- */}
      <Audio src={sonido("cama-tension.wav")} volume={0.5} />
      <Audio src={sonido("cama-resolucion.wav")} from={MOMENTO.agenteEntra} volume={0.5} />
      <Audio src={sonido("cama-final.wav")} from={MOMENTO.titular - 10} volume={0.55} />

      {TICS_MENSAJES.map((f, i) => (
        <Audio
          key={`tic-${f}-${i}`}
          src={sonido("tic.wav")}
          from={f}
          // Los primeros entran despacio, los ultimos pegan mas fuerte.
          volume={0.22 + 0.2 * (i / (TICS_MENSAJES.length - 1))}
        />
      ))}

      <Audio src={sonido("riser.wav")} from={MOMENTO.riser} volume={0.45} />
      <Audio src={sonido("whoosh.wav")} from={MOMENTO.whoosh} volume={0.55} />
      <Audio src={sonido("impacto-agente.wav")} from={MOMENTO.agenteEntra} volume={0.8} />

      {SWISHES_RESUELTOS.map((f, i) => (
        <Audio key={`swish-${f}-${i}`} src={sonido("swish.wav")} from={f} volume={0.5} />
      ))}

      <Audio src={sonido("check.wav")} from={MOMENTO.check} volume={0.6} />
      <Audio src={sonido("pop.wav")} from={MOMENTO.boton} volume={0.5} />
    </AbsoluteFill>
  );
};
