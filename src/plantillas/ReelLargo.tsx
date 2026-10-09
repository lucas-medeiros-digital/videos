import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { REEL_EN_LARGO } from "../guion";
import { AudioReel, ReelVisual } from "./ReelAgente";
import {
  CierreMarca,
  Escena,
  FondoMarca,
  MARCA,
  Subrayado,
  Titular,
  entrada,
  usarFuentes,
} from "../componentes/marca";

/**
 * La version larga arranca con el reel tal cual y sigue a partir del
 * titular. Por eso el reel se corta en REEL_EN_LARGO: ahi ya paso
 * "Ninguna consulta se te escapa" y todavia no aparecio el logo, que en
 * esta version tiene que cerrar el video entero y no la mitad.
 */
const PASO_DURACION = 135;
// El puente se lleva los 90 frames entre el reel y el primer paso: con
// menos no da tiempo de leerlo.
const PASOS_DESDE = 480;

const PASOS = [
  {
    numero: "01",
    titulo: "Auditamos tu negocio",
    cuerpo:
      "Leemos tus últimas conversaciones: qué te preguntan, qué respondés y en qué momento se te cae la venta.",
  },
  {
    numero: "02",
    titulo: "Entrenamos al agente",
    cuerpo:
      "Le cargamos precios, horarios, stock y tu forma de hablar. Responde como respondés vos, no como un robot.",
  },
  {
    numero: "03",
    titulo: "Lo conectamos",
    cuerpo:
      "Entra a tu WhatsApp de siempre. Mismo número, mismo chat: no cambiás nada de lo que ya usás.",
  },
  {
    numero: "04",
    titulo: "Lo afinamos con vos",
    cuerpo:
      "Las dos primeras semanas revisamos cada conversación y lo ajustamos hasta que conteste como querés.",
  },
] as const;

const paso = (i: number) => PASOS_DESDE + i * PASO_DURACION;
const COMPARACION = paso(PASOS.length);
const CIERRE = COMPARACION + 220;
export const DURACION_LARGO = CIERRE + 105;

/** Las dos columnas del antes y despues, en una sola pantalla. */
const HOY = [
  "Respondés a las once de la noche",
  "El fin de semana no atiende nadie",
  "El que espera seis horas, se va",
] as const;

const CON_AGENTE = [
  "Responde en tres segundos, siempre",
  "Sábado a las dos de la mañana, también",
  "Solo te pasa los que quieren comprar",
] as const;

const sonido = (nombre: string) => staticFile(`audio/${nombre}`);

/** Puente entre el reel y los pasos. */
const Puente: React.FC<{ desde: number }> = ({ desde }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: "0 92px" }}
    >
      <div style={{ ...entrada(frame, fps, desde), textAlign: "center" }}>
        <Titular tamano={96} color={MARCA.tenue}>
          No se arma
          <br />
          en un día.
        </Titular>
        <Titular tamano={116} estilo={{ marginTop: 26 }}>
          Se arma en
          <br />
          cuatro pasos.
        </Titular>
      </div>
    </AbsoluteFill>
  );
};

const Paso: React.FC<{ indice: number }> = ({ indice }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const datos = PASOS[indice];
  const desde = paso(indice);

  const avanceSubrayado = interpolate(frame - desde, [14, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 92px 0 160px" }}>
      <div style={entrada(frame, fps, desde, { distancia: 70 })}>
        <span
          style={{
            fontFamily: MARCA.serif,
            fontWeight: 800,
            fontSize: 178,
            lineHeight: 0.9,
            color: MARCA.dorado,
            display: "block",
          }}
        >
          {datos.numero}
        </span>
      </div>
      <div
        style={{
          ...entrada(frame, fps, desde, { retardo: 7, distancia: 50 }),
          marginTop: 30,
          maxWidth: 820,
        }}
      >
        <Titular tamano={92}>{datos.titulo}</Titular>
        <Subrayado avance={avanceSubrayado} />
      </div>
      <p
        style={{
          ...entrada(frame, fps, desde, { retardo: 16, distancia: 36 }),
          margin: "36px 0 0",
          maxWidth: 760,
          fontFamily: MARCA.sans,
          fontSize: 44,
          lineHeight: 1.42,
          color: MARCA.tenue,
        }}
      >
        {datos.cuerpo}
      </p>
    </AbsoluteFill>
  );
};

/** Riel de progreso de los cuatro pasos. */
const Riel: React.FC = () => {
  const frame = useCurrentFrame();
  const actual = PASOS.reduce((a, _, i) => (frame >= paso(i) ? i : a), -1);
  if (actual < 0 || frame >= COMPARACION) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 86,
        top: 718,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {PASOS.map((p, i) => (
        <div
          key={p.numero}
          style={{
            width: 9,
            height: i === actual ? 70 : 32,
            borderRadius: 6,
            background: i <= actual ? MARCA.dorado : "rgba(255,255,255,0.16)",
          }}
        />
      ))}
    </div>
  );
};

/** Una fila del antes y despues. */
const Fila: React.FC<{ texto: string; desde: number; bueno: boolean }> = ({
  texto,
  desde,
  bueno,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const avance = spring({
    frame: frame - desde,
    fps,
    config: { damping: 200, mass: 0.6 },
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity: avance,
        transform: `translateX(${interpolate(avance, [0, 1], [-34, 0])}px)`,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 46,
          height: 46,
          borderRadius: bueno ? "50%" : 12,
          border: bueno ? "none" : "3px solid rgba(255,255,255,0.26)",
          background: bueno ? MARCA.dorado : "transparent",
          color: bueno ? MARCA.verdeProfundo : "rgba(255,255,255,0.42)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: bueno ? 26 : 28,
          fontWeight: 700,
        }}
      >
        {bueno ? "✓" : "×"}
      </span>
      <span
        style={{
          fontFamily: MARCA.sans,
          fontSize: 44,
          fontWeight: bueno ? 500 : 400,
          lineHeight: 1.3,
          color: bueno ? MARCA.blanco : MARCA.tenue,
        }}
      >
        {texto}
      </span>
    </div>
  );
};

/** Toda la comparacion en una sola pantalla: arriba hoy, abajo con el agente. */
const Comparacion: React.FC<{ desde: number }> = ({ desde }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bloque = (
    rotulo: string,
    color: string,
    lineas: readonly string[],
    arranque: number,
    bueno: boolean,
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <span
        style={{
          ...entrada(frame, fps, arranque, { distancia: 18 }),
          fontFamily: MARCA.sans,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: 6,
          textTransform: "uppercase",
          color,
        }}
      >
        {rotulo}
      </span>
      {lineas.map((texto, i) => (
        <Fila key={texto} texto={texto} desde={arranque + 10 + i * 16} bueno={bueno} />
      ))}
    </div>
  );

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", padding: "0 86px", gap: 76 }}
    >
      {bloque("Hoy", "rgba(255,255,255,0.38)", HOY, desde, false)}
      <div
        style={{
          height: 2,
          background: "rgba(255,255,255,0.1)",
          opacity: entrada(frame, fps, desde + 70).opacity,
        }}
      />
      {bloque("Con el agente", MARCA.dorado, CON_AGENTE, desde + 78, true)}
    </AbsoluteFill>
  );
};

/**
 * Version larga: el reel completo hasta el titular y, a partir de ahi,
 * como se pone en marcha y que cambia.
 */
export const ReelLargo: React.FC = () => {
  usarFuentes();

  return (
    <FondoMarca>
      {/* El reel original, igual que en la version corta. */}
      <ReelVisual hasta={REEL_EN_LARGO} />

      <Escena desde={REEL_EN_LARGO} hasta={PASOS_DESDE} salidaEn={12}>
        <Puente desde={REEL_EN_LARGO + 4} />
      </Escena>

      {PASOS.map((p, i) => (
        <Escena key={p.numero} desde={paso(i)} hasta={paso(i) + PASO_DURACION}>
          <Paso indice={i} />
        </Escena>
      ))}
      <Riel />

      <Escena desde={COMPARACION} hasta={CIERRE} salidaEn={16}>
        <Comparacion desde={COMPARACION} />
      </Escena>

      <Escena desde={CIERRE} hasta={DURACION_LARGO} salidaEn={0}>
        <CierreMarca desde={CIERRE} />
      </Escena>

      {/* --- Audio --- */}
      {/* El reel sin su cierre: aca el cierre va al final de todo. */}
      <AudioReel conCierre={false} />
      <Audio src={sonido("musica-larga.wav")} volume={0.5} />

      <Audio src={sonido("barrido.wav")} from={REEL_EN_LARGO - 18} volume={0.4} />
      {PASOS.map((p, i) => (
        <Audio
          key={`p-${p.numero}`}
          src={sonido("confirmacion.wav")}
          from={paso(i)}
          volume={0.6}
        />
      ))}
      {HOY.map((_, i) => (
        <Audio
          key={`h${i}`}
          src={sonido("clic.wav")}
          from={COMPARACION + 10 + i * 16}
          volume={0.42}
        />
      ))}
      {CON_AGENTE.map((_, i) => (
        <Audio
          key={`a${i}`}
          src={sonido("confirmacion.wav")}
          from={COMPARACION + 88 + i * 16}
          volume={0.5}
        />
      ))}
      <Audio src={sonido("marca.wav")} from={CIERRE - 40} volume={0.85} />
    </FondoMarca>
  );
};
