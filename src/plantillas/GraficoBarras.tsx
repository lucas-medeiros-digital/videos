import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORES } from "../formato";

export type Barra = {
  etiqueta: string;
  valor: number;
};

export type PropsGraficoBarras = {
  titulo: string;
  barras: Barra[];
  /** Texto que acompana al valor, por ejemplo "k" o "%". */
  sufijo?: string;
};

/**
 * Grafico de barras que crecen una despues de la otra,
 * con el numero contando hasta su valor final.
 */
export const GraficoBarras: React.FC<PropsGraficoBarras> = ({
  titulo,
  barras,
  sufijo = "",
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const maximo = Math.max(...barras.map((b) => b.valor));
  const alturaMaxima = height * 0.42;
  const framesEntreBarras = 8;

  const entradaTitulo = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        background: COLORES.fondo,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, Helvetica, sans-serif",
      }}
    >
      <h2
        style={{
          position: "absolute",
          top: 260,
          margin: 0,
          padding: "0 90px",
          fontSize: 86,
          fontWeight: 800,
          color: COLORES.texto,
          textAlign: "center",
          opacity: entradaTitulo,
          transform: `translateY(${interpolate(entradaTitulo, [0, 1], [40, 0])}px)`,
        }}
      >
        {titulo}
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 44,
          height: alturaMaxima,
          marginTop: 120,
        }}
      >
        {barras.map((barra, i) => {
          const crecimiento = spring({
            frame: frame - 18 - i * framesEntreBarras,
            fps,
            config: { damping: 200, mass: 1.1 },
          });
          const alturaBarra = (barra.valor / maximo) * alturaMaxima * crecimiento;
          const valorMostrado = Math.round(barra.valor * crecimiento);

          return (
            <div
              key={barra.etiqueta}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  color: COLORES.acentoSuave,
                  opacity: crecimiento,
                }}
              >
                {valorMostrado}
                {sufijo}
              </span>
              <div
                style={{
                  width: 130,
                  height: alturaBarra,
                  borderRadius: "18px 18px 6px 6px",
                  background: `linear-gradient(180deg, ${COLORES.acento} 0%, #8A1F1F 100%)`,
                }}
              />
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 600,
                  color: COLORES.texto,
                  opacity: 0.85,
                }}
              >
                {barra.etiqueta}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
