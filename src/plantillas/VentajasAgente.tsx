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
  Titular,
  entrada,
  salida,
  usarFuentes,
} from "../componentes/marca";

const GANCHO = { desde: 0, hasta: 90 };
const DOLORES_DESDE = 95;
const GIRO = { desde: 350, hasta: 430 };
const VENTAJAS_DESDE = 435;
const REMATE = { desde: 700, hasta: 790 };
const CIERRE = 790;
export const DURACION_VENTAJAS = 880;

/** Lo que duele hoy. Cada linea entra sola. */
const DOLORES = [
  "Contestás a las once de la noche.",
  "El fin de semana no atiende nadie.",
  "Repetís el mismo precio treinta veces por día.",
  "El que espera seis horas ya compró en otro lado.",
] as const;

/** Lo que cambia con el agente. */
const VENTAJAS = [
  "Responde en tres segundos. Siempre.",
  "Sábado a las dos de la mañana, también.",
  "Nunca se equivoca con un precio ni un horario.",
  "Solo te pasa los que están listos para comprar.",
] as const;

const PASO_ENTRE_LINEAS = 58;
const sonido = (nombre: string) => staticFile(`audio/${nombre}`);

/** Una linea de la lista, con su marca a la izquierda. */
const Linea: React.FC<{
  texto: string;
  desde: number;
  tipo: "dolor" | "ventaja";
}> = ({ texto, desde, tipo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const avance = spring({
    frame: frame - desde,
    fps,
    config: { damping: 200, mass: 0.6 },
  });
  const esDolor = tipo === "dolor";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 30,
        opacity: avance,
        transform: `translateX(${interpolate(avance, [0, 1], [-50, 0])}px)`,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          marginTop: 6,
          borderRadius: esDolor ? 14 : "50%",
          border: esDolor ? "3px solid rgba(255,255,255,0.28)" : "none",
          background: esDolor ? "transparent" : MARCA.dorado,
          color: esDolor ? "rgba(255,255,255,0.45)" : MARCA.verdeProfundo,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: esDolor ? 34 : 32,
          fontWeight: 700,
          transform: `scale(${interpolate(avance, [0, 1], [0.6, 1])})`,
        }}
      >
        {esDolor ? "×" : "✓"}
      </span>
      <span
        style={{
          fontFamily: MARCA.sans,
          fontSize: 52,
          fontWeight: esDolor ? 400 : 500,
          lineHeight: 1.26,
          color: esDolor ? MARCA.tenue : MARCA.blanco,
        }}
      >
        {texto}
      </span>
    </div>
  );
};

const Lista: React.FC<{
  rotulo: string;
  colorRotulo: string;
  lineas: readonly string[];
  desde: number;
}> = ({ rotulo, colorRotulo, lineas, desde }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 92px" }}>
      <span
        style={{
          ...entrada(frame, fps, desde, { distancia: 24 }),
          fontFamily: MARCA.sans,
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: colorRotulo,
          marginBottom: 58,
        }}
      >
        {rotulo}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 46 }}>
        {lineas.map((texto, i) => (
          <Linea
            key={texto}
            texto={texto}
            desde={desde + 18 + i * PASO_ENTRE_LINEAS}
            tipo={colorRotulo === MARCA.dorado ? "ventaja" : "dolor"}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Video 2: primero lo que duele, despues lo que cambia.
 * El giro del medio es el mismo que el del reel corto.
 */
export const VentajasAgente: React.FC = () => {
  usarFuentes();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const destelloGiro = interpolate(
    frame,
    [GIRO.desde, GIRO.desde + 2, GIRO.desde + 16],
    [0, 0.5, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <FondoMarca>
      {/* --- Gancho --- */}
      <Escena desde={0} hasta={GANCHO.hasta} salidaEn={16}
        estilo={{ justifyContent: "center", padding: "0 92px" }}>
        <div style={entrada(frame, fps, -6)}>
          <Titular tamano={104}>
            Cada consulta
            <br />
            sin responder
          </Titular>
        </div>
        <div style={{ ...entrada(frame, fps, 26), marginTop: 30 }}>
          <Titular tamano={104} color={MARCA.dorado}>
            es una venta
            <br />
            que se fue.
          </Titular>
        </div>
      </Escena>

      {/* --- Los dolores --- */}
      <Escena desde={DOLORES_DESDE} hasta={GIRO.desde} salidaEn={16}>
        <Lista
          rotulo="Hoy"
          colorRotulo="rgba(255,255,255,0.4)"
          lineas={DOLORES}
          desde={DOLORES_DESDE}
        />
      </Escena>

      {/* --- El giro --- */}
      <Escena desde={GIRO.desde} hasta={GIRO.hasta} salidaEn={12}
        estilo={{ justifyContent: "center", alignItems: "center" }}>
        <div
            style={{
              ...entrada(frame, fps, GIRO.desde, { distancia: 0 }),
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "28px 56px",
              borderRadius: 999,
              background: MARCA.dorado,
            }}
          >
            <span style={{ fontSize: 44 }}>⚡</span>
            <span
              style={{
                fontFamily: MARCA.sans,
                fontSize: 54,
                fontWeight: 600,
                color: MARCA.verdeProfundo,
              }}
            >
            Entra tu agente
          </span>
        </div>
      </Escena>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${MARCA.doradoClaro} 0%, rgba(201,162,39,0) 65%)`,
          opacity: destelloGiro,
          mixBlendMode: "screen",
        }}
      />

      {/* --- Las ventajas --- */}
      <Escena desde={VENTAJAS_DESDE} hasta={REMATE.desde} salidaEn={16}>
        <Lista
          rotulo="Con el agente"
          colorRotulo={MARCA.dorado}
          lineas={VENTAJAS}
          desde={VENTAJAS_DESDE}
        />
      </Escena>

      {/* --- Remate --- */}
      <Escena desde={REMATE.desde} hasta={REMATE.hasta}
        estilo={{ justifyContent: "center", padding: "0 92px" }}>
        <div style={entrada(frame, fps, REMATE.desde)}>
          <Titular tamano={100}>
            El agente atiende
            <br />
            a todos.
          </Titular>
        </div>
        <div style={{ ...entrada(frame, fps, REMATE.desde + 20), marginTop: 28 }}>
          <Titular tamano={100} color={MARCA.dorado}>
            Vos atendés
            <br />
            a los que compran.
          </Titular>
        </div>
      </Escena>

      {/* --- Cierre de marca --- */}
      <Escena desde={CIERRE} hasta={DURACION_VENTAJAS} salidaEn={0}>
        <CierreMarca desde={CIERRE} />
      </Escena>

      {/* --- Audio --- */}
      <Audio src={sonido("groove-largo.wav")} volume={0.78} />
      {DOLORES.map((_, i) => (
        <Audio
          key={`d${i}`}
          src={sonido("tic.wav")}
          from={DOLORES_DESDE + 18 + i * PASO_ENTRE_LINEAS}
          volume={0.3}
        />
      ))}
      <Audio src={sonido("whoosh.wav")} from={GIRO.desde - 14} volume={0.5} />
      <Audio src={sonido("impacto-agente.wav")} from={GIRO.desde} volume={0.85} />
      {VENTAJAS.map((_, i) => (
        <Audio
          key={`v${i}`}
          src={sonido("check.wav")}
          from={VENTAJAS_DESDE + 18 + i * PASO_ENTRE_LINEAS}
          volume={0.26}
        />
      ))}
      <Audio src={sonido("pop.wav")} from={CIERRE + 8} volume={0.5} />
    </FondoMarca>
  );
};
