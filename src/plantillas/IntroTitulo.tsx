import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORES } from "../formato";

export type PropsIntroTitulo = {
  titulo: string;
  subtitulo?: string;
  /** Rutas a los logos. Usa staticFile("logo.png") si los pones en public/. */
  logoIzquierda?: string;
  logoDerecha?: string;
};

/** Cuadrado de relleno para cuando todavia no cargaste un logo real. */
const LogoMarcador: React.FC<{ color: string; letra: string }> = ({
  color,
  letra,
}) => (
  <div
    style={{
      width: 160,
      height: 160,
      borderRadius: 36,
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, Helvetica, sans-serif",
      fontSize: 86,
      fontWeight: 800,
      color: COLORES.fondo,
    }}
  >
    {letra}
  </div>
);

/**
 * Apertura: dos logos entran desde los costados, el titulo sube desde abajo.
 */
export const IntroTitulo: React.FC<PropsIntroTitulo> = ({
  titulo,
  subtitulo,
  logoIzquierda,
  logoDerecha,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const entradaLogos = spring({
    frame,
    fps,
    config: { damping: 200, mass: 0.6 },
  });
  const desplazamiento = interpolate(entradaLogos, [0, 1], [width * 0.35, 0]);

  const entradaTitulo = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200, mass: 0.8 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, #1A1F2E 0%, ${COLORES.fondo} 70%)`,
        justifyContent: "center",
        alignItems: "center",
        gap: 80,
      }}
    >
      <div style={{ display: "flex", gap: 64, alignItems: "center" }}>
        <div style={{ transform: `translateX(${-desplazamiento}px)` }}>
          {logoIzquierda ? (
            <Img src={logoIzquierda} style={{ width: 160, height: 160 }} />
          ) : (
            <LogoMarcador color={COLORES.acento} letra="A" />
          )}
        </div>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: COLORES.texto,
            opacity: entradaLogos,
          }}
        />
        <div style={{ transform: `translateX(${desplazamiento}px)` }}>
          {logoDerecha ? (
            <Img src={logoDerecha} style={{ width: 160, height: 160 }} />
          ) : (
            <LogoMarcador color={COLORES.acentoSuave} letra="B" />
          )}
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${interpolate(entradaTitulo, [0, 1], [120, 0])}px)`,
          opacity: entradaTitulo,
          textAlign: "center",
          padding: "0 90px",
          fontFamily: "system-ui, -apple-system, Helvetica, sans-serif",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 112,
            lineHeight: 1.05,
            fontWeight: 800,
            color: COLORES.texto,
            letterSpacing: -2,
          }}
        >
          {titulo}
        </h1>
        {subtitulo ? (
          <p
            style={{
              marginTop: 32,
              fontSize: 54,
              fontWeight: 500,
              color: COLORES.acentoSuave,
            }}
          >
            {subtitulo}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
