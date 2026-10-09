import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORES } from "../formato";
import type { Palabra } from "../datos/subtitulos";

type Props = {
  palabras: Palabra[];
  /** Desplaza todos los tiempos, en segundos. Util si los subtitulos van adelantados o atrasados. */
  ajuste?: number;
  /** Distancia desde el borde inferior, en pixeles. */
  margenInferior?: number;
};

/**
 * Subtitulos palabra por palabra: muestra la frase en curso y resalta
 * la palabra que se esta diciendo en este frame.
 */
export const Subtitulos: React.FC<Props> = ({
  palabras,
  ajuste = 0,
  margenInferior = 360,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segundoActual = frame / fps - ajuste;

  const indiceActivo = palabras.findIndex(
    (p) => segundoActual >= p.desde && segundoActual < p.hasta,
  );
  if (indiceActivo === -1) {
    return null;
  }

  // Agrupa hasta 4 palabras alrededor de la activa para que se lea el contexto.
  const inicioGrupo = Math.max(0, indiceActivo - (indiceActivo % 4));
  const grupo = palabras.slice(inicioGrupo, inicioGrupo + 4);

  const activa = palabras[indiceActivo];
  const avance = interpolate(
    segundoActual,
    [activa.desde, Math.min(activa.desde + 0.12, activa.hasta)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: margenInferior,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.3em",
        padding: "0 80px",
        fontFamily: "system-ui, -apple-system, Helvetica, sans-serif",
        fontSize: 84,
        fontWeight: 800,
        lineHeight: 1.15,
        textAlign: "center",
      }}
    >
      {grupo.map((palabra, i) => {
        const esActiva = inicioGrupo + i === indiceActivo;
        return (
          <span
            key={`${palabra.texto}-${palabra.desde}`}
            style={{
              color: esActiva ? COLORES.acentoSuave : COLORES.texto,
              transform: `scale(${esActiva ? 1 + 0.08 * avance : 1})`,
              textShadow: `0 6px 24px ${COLORES.sombra}`,
              transition: "none",
            }}
          >
            {palabra.texto}
          </span>
        );
      })}
    </div>
  );
};
