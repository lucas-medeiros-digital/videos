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
import {
  CierreMarca,
  Escena,
  FondoMarca,
  MARCA,
  Subrayado,
  Titular,
  entrada,
  salida,
  usarFuentes,
} from "../componentes/marca";

/** Los cuatro pasos, con el frame en el que entra cada uno. */
const PASOS = [
  {
    numero: "01",
    titulo: "Auditamos tu negocio",
    cuerpo:
      "Leemos tus últimas conversaciones: qué te preguntan, qué respondés y en qué momento se te cae la venta.",
    desde: 80,
  },
  {
    numero: "02",
    titulo: "Entrenamos al agente",
    cuerpo:
      "Le cargamos precios, horarios, stock y tu forma de hablar. Responde como respondés vos, no como un robot.",
    desde: 230,
  },
  {
    numero: "03",
    titulo: "Lo conectamos",
    cuerpo:
      "Entra a tu WhatsApp de siempre. Mismo número, mismo chat: no cambiás nada de lo que ya usás.",
    desde: 380,
  },
  {
    numero: "04",
    titulo: "Lo afinamos con vos",
    cuerpo:
      "Las dos primeras semanas revisamos cada conversación y lo ajustamos hasta que conteste como querés.",
    desde: 530,
  },
] as const;

const DURACION_PASO = 150;
const REMATE = 680;
const CIERRE = 760;
export const DURACION_PROCESO = 840;

const sonido = (nombre: string) => staticFile(`audio/${nombre}`);

/** Riel de progreso: una marca por paso, se llena a medida que avanzan. */
const Riel: React.FC<{ pasoActual: number }> = ({ pasoActual }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        top: 700,
        display: "flex",
        flexDirection: "column",
        gap: 26,
      }}
    >
      {PASOS.map((paso, i) => {
        const activo = i <= pasoActual;
        const avance = spring({
          frame: frame - paso.desde,
          fps,
          config: { damping: 200, mass: 0.5 },
        });
        return (
          <div
            key={paso.numero}
            style={{
              width: 10,
              height: i === pasoActual ? 74 : 34,
              borderRadius: 6,
              background: activo ? MARCA.dorado : "rgba(255,255,255,0.16)",
              opacity: activo ? 0.35 + 0.65 * avance : 1,
              transition: "none",
            }}
          />
        );
      })}
    </div>
  );
};

/** Una pantalla de paso: numero grande, titulo y cuerpo. */
const Paso: React.FC<{ indice: number }> = ({ indice }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const paso = PASOS[indice];
  const local = frame - paso.desde;
  const avanceSubrayado = interpolate(local, [14, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", padding: "0 92px 0 170px" }}
    >
      <div style={{ ...entrada(frame, fps, paso.desde, { distancia: 70 }) }}>
        <span
          style={{
            fontFamily: MARCA.serif,
            fontWeight: 800,
            fontSize: 190,
            lineHeight: 0.9,
            color: MARCA.dorado,
            display: "block",
          }}
        >
          {paso.numero}
        </span>
      </div>

      <div
        style={{
          ...entrada(frame, fps, paso.desde, { retardo: 7, distancia: 50 }),
          marginTop: 34,
          maxWidth: 820,
        }}
      >
        <Titular tamano={94}>{paso.titulo}</Titular>
        <Subrayado avance={avanceSubrayado} />
      </div>

      <p
        style={{
          ...entrada(frame, fps, paso.desde, { retardo: 16, distancia: 36 }),
          margin: "38px 0 0",
          maxWidth: 760,
          fontFamily: MARCA.sans,
          fontSize: 44,
          fontWeight: 400,
          lineHeight: 1.42,
          color: MARCA.tenue,
        }}
      >
        {paso.cuerpo}
      </p>
    </AbsoluteFill>
  );
};

/**
 * Video 1: que pasa despues de contratar el agente.
 * Cuatro pasos, con el remate puesto en el plazo.
 */
export const ProcesoAgente: React.FC = () => {
  usarFuentes();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pasoActual = PASOS.reduce(
    (actual, paso, i) => (frame >= paso.desde ? i : actual),
    -1,
  );

  return (
    <FondoMarca>
      {/* --- Gancho --- */}
      <Escena desde={0} hasta={80} estilo={{ justifyContent: "center", padding: "0 92px" }}>
        <div style={entrada(frame, fps, -6)}>
          <Titular tamano={92} color={MARCA.tenue}>
            Un agente de WhatsApp
            <br />
            no se arma en un día.
          </Titular>
        </div>
        <div style={{ ...entrada(frame, fps, 24), marginTop: 40 }}>
          <Titular tamano={116}>
            Se arma en
            <br />
            cuatro pasos.
          </Titular>
        </div>
      </Escena>

      {/* --- Los cuatro pasos --- */}
      {PASOS.map((paso, i) => (
        <Escena
          key={paso.numero}
          desde={paso.desde}
          hasta={paso.desde + DURACION_PASO}
        >
          <Paso indice={i} />
        </Escena>
      ))}
      {pasoActual >= 0 && frame < REMATE ? <Riel pasoActual={pasoActual} /> : null}

      {/* --- Remate --- */}
      <Escena
        desde={REMATE}
        hasta={CIERRE}
        estilo={{ justifyContent: "center", alignItems: "center", padding: "0 96px" }}
      >
        <div style={{ ...entrada(frame, fps, REMATE), textAlign: "center" }}>
          <span
            style={{
              fontFamily: MARCA.sans,
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: MARCA.dorado,
            }}
          >
            Día 7
          </span>
          <Titular tamano={116} estilo={{ marginTop: 26 }}>
            Ya está
            <br />
            respondiendo.
          </Titular>
        </div>
      </Escena>

      {/* --- Cierre de marca --- */}
      <Escena desde={CIERRE} hasta={DURACION_PROCESO} salidaEn={0}>
        <CierreMarca desde={CIERRE} />
      </Escena>

      {/* --- Audio --- */}
      <Audio src={sonido("groove-largo.wav")} volume={0.78} />
      {PASOS.map((paso) => (
        <Audio
          key={`sw-${paso.numero}`}
          src={sonido("whoosh.wav")}
          from={paso.desde - 3}
          volume={0.3}
        />
      ))}
      <Audio src={sonido("impacto-agente.wav")} from={REMATE} volume={0.55} />
      <Audio src={sonido("check.wav")} from={REMATE + 10} volume={0.45} />
      <Audio src={sonido("pop.wav")} from={CIERRE + 8} volume={0.5} />
    </FondoMarca>
  );
};
