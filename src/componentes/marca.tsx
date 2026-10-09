import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

/** Paleta y tipografias de Vinculo, tomadas del reel original. */
export const MARCA = {
  verde: "#0E2A20",
  verdeProfundo: "#071A13",
  verdeClaro: "#1C4A38",
  dorado: "#C9A227",
  doradoClaro: "#E8C76A",
  blanco: "#FFFFFF",
  tenue: "rgba(255,255,255,0.62)",
  serif: '"Playfair Display", Georgia, serif',
  sans: 'Inter, system-ui, -apple-system, sans-serif',
} as const;

/**
 * Carga la serif de la marca antes de que empiece el render.
 *
 * Sin el delayRender los primeros frames saldrian con la tipografia de
 * reemplazo, porque el navegador todavia no termino de cargar el archivo.
 */
export const usarFuentes = () => {
  const [espera] = useState(() => delayRender("cargando Playfair Display"));

  useEffect(() => {
    const pesos = [
      ["500", "fuentes/playfair-500.ttf"],
      ["700", "fuentes/playfair-700.ttf"],
      ["800", "fuentes/playfair-800.ttf"],
    ] as const;

    Promise.all(
      pesos.map(async ([peso, archivo]) => {
        const fuente = new FontFace(
          "Playfair Display",
          `url(${staticFile(archivo)}) format("truetype")`,
          { weight: peso },
        );
        await fuente.load();
        // El tipo de FontFaceSet que trae la lib DOM de TS no declara add().
        (document.fonts as FontFaceSet & { add(f: FontFace): void }).add(fuente);
      }),
    )
      .then(() => continueRender(espera))
      .catch(() => continueRender(espera));
  }, [espera]);
};

/** El fondo verde con el degradado suave del reel. */
export const FondoMarca: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 85% 55% at 50% 38%, ${MARCA.verdeClaro} 0%, ${MARCA.verde} 45%, ${MARCA.verdeProfundo} 100%)`,
      fontFamily: MARCA.sans,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** Entrada estandar: sube y aparece. Devuelve estilo listo para usar. */
export const entrada = (
  frame: number,
  fps: number,
  desde: number,
  { distancia = 60, retardo = 0 } = {},
) => {
  const avance = spring({
    frame: frame - desde - retardo,
    fps,
    config: { damping: 200, mass: 0.7 },
  });
  return {
    opacity: avance,
    transform: `translateY(${interpolate(avance, [0, 1], [distancia, 0])}px)`,
  };
};

/**
 * Salida por desvanecido, para cerrar una escena.
 * Con duracion 0 no hay desvanecido: la ultima escena del video no tiene
 * que apagarse, y un rango de ancho cero rompe interpolate().
 */
export const salida = (frame: number, hasta: number, duracion = 12) =>
  duracion <= 0
    ? 1
    : interpolate(frame, [hasta - duracion, hasta], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

/**
 * Una escena entre dos frames, con desvanecido de salida.
 *
 * Se usa esto y no <Sequence> a proposito: dentro de una Sequence
 * useCurrentFrame() devuelve el frame LOCAL, y todos los tiempos de estos
 * videos estan escritos en frames globales. Mezclar las dos cosas hace
 * que las escenas queden vacias sin ningun error visible.
 */
export const Escena: React.FC<{
  desde: number;
  hasta: number;
  salidaEn?: number;
  children: React.ReactNode;
  estilo?: React.CSSProperties;
}> = ({ desde, hasta, salidaEn = 14, children, estilo }) => {
  const frame = useCurrentFrame();
  if (frame < desde || frame >= hasta) {
    return null;
  }
  return (
    <AbsoluteFill style={{ opacity: salida(frame, hasta, salidaEn), ...estilo }}>
      {children}
    </AbsoluteFill>
  );
};

/** Titular en serif, el mismo tono que "Ninguna consulta se te escapa". */
export const Titular: React.FC<{
  children: React.ReactNode;
  tamano?: number;
  color?: string;
  estilo?: React.CSSProperties;
}> = ({ children, tamano = 104, color = MARCA.blanco, estilo }) => (
  <h1
    style={{
      margin: 0,
      fontFamily: MARCA.serif,
      fontWeight: 700,
      fontSize: tamano,
      lineHeight: 1.08,
      letterSpacing: -1,
      color,
      ...estilo,
    }}
  >
    {children}
  </h1>
);

/** Subrayado dorado que se dibuja solo, como el de "escapa". */
export const Subrayado: React.FC<{ avance: number; grosor?: number }> = ({
  avance,
  grosor = 7,
}) => (
  <span
    style={{
      display: "block",
      height: grosor,
      borderRadius: grosor,
      background: MARCA.dorado,
      width: `${Math.max(0, Math.min(1, avance)) * 100}%`,
      marginTop: 10,
    }}
  />
);

/** El logo de Vinculo, recortado del reel original. */
export const LogoVinculo: React.FC<{ ancho?: number; estilo?: React.CSSProperties }> = ({
  ancho = 560,
  estilo,
}) => (
  <Img
    src={staticFile("logo-vinculo.png")}
    style={{ width: ancho, height: "auto", ...estilo }}
  />
);

/** El boton dorado del cierre. */
export const BotonEscribinos: React.FC<{ escala?: number }> = ({ escala = 1 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "26px 52px",
      borderRadius: 999,
      background: MARCA.dorado,
      transform: `scale(${escala})`,
      boxShadow: `0 18px 50px rgba(201,162,39,0.28)`,
    }}
  >
    <span
      style={{
        fontFamily: MARCA.sans,
        fontSize: 46,
        fontWeight: 600,
        color: MARCA.verdeProfundo,
      }}
    >
      Escribinos
    </span>
    <span
      style={{
        width: 46,
        height: 46,
        borderRadius: "50%",
        background: MARCA.verdeProfundo,
        color: MARCA.dorado,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 700,
      }}
    >
      ↗
    </span>
  </div>
);

/** Cierre de marca compartido por los dos videos. */
export const CierreMarca: React.FC<{ desde: number; bajada?: string }> = ({
  desde,
  bajada = "y te armamos tu agente de WhatsApp.",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const botonAvance = spring({
    frame: frame - desde - 8,
    fps,
    config: { damping: 11, mass: 0.5 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 58,
        padding: "0 90px",
      }}
    >
      <div style={entrada(frame, fps, desde)}>
        <LogoVinculo ancho={600} />
      </div>
      <div style={{ opacity: botonAvance }}>
        <BotonEscribinos escala={interpolate(botonAvance, [0, 1], [0.86, 1])} />
      </div>
      <p
        style={{
          ...entrada(frame, fps, desde, { retardo: 16, distancia: 26 }),
          margin: 0,
          fontFamily: MARCA.sans,
          fontSize: 38,
          fontWeight: 400,
          color: MARCA.tenue,
          textAlign: "center",
        }}
      >
        {bajada}
      </p>
    </AbsoluteFill>
  );
};
