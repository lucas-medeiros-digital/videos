import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORES } from "../formato";
import { Subtitulos } from "../componentes/Subtitulos";
import type { Palabra } from "../datos/subtitulos";

export type PropsVideoConSubtitulos = {
  /**
   * Nombre del archivo dentro de public/, por ejemplo "mi-video.mp4".
   * Dejalo en null para previsualizar la plantilla sin video.
   */
  archivoVideo: string | null;
  palabras: Palabra[];
  /** Rotulo que aparece arriba durante los primeros segundos. */
  rotulo?: string;
  /** Desfase de los subtitulos en segundos. Negativo = adelantarlos. */
  ajusteSubtitulos?: number;
};

/** Fondo de prueba para cuando todavia no copiaste tu video a public/. */
const FondoDePrueba: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const giro = interpolate(frame, [0, durationInFrames], [0, 40]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${140 + giro}deg, #1E2746 0%, ${COLORES.fondo} 55%, #2A1230 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "system-ui, -apple-system, Helvetica, sans-serif",
          fontSize: 38,
          fontWeight: 600,
          color: "rgba(255,255,255,0.35)",
          textAlign: "center",
          padding: "0 120px",
        }}
      >
        Copia tu video a public/ y pasalo en archivoVideo
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Plantilla principal: tu video vertical, un rotulo al inicio
 * y subtitulos palabra por palabra sobre el.
 */
export const VideoConSubtitulos: React.FC<PropsVideoConSubtitulos> = ({
  archivoVideo,
  palabras,
  rotulo,
  ajusteSubtitulos = 0,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: COLORES.fondo }}>
      {archivoVideo ? (
        <OffthreadVideo
          src={staticFile(archivoVideo)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <FondoDePrueba />
      )}

      {/* Degradado inferior: hace legibles los subtitulos sobre cualquier imagen. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {rotulo ? (
        <Sequence durationInFrames={Math.round(fps * 3)}>
          <RotuloSuperior texto={rotulo} />
        </Sequence>
      ) : null}

      <Subtitulos palabras={palabras} ajuste={ajusteSubtitulos} />
    </AbsoluteFill>
  );
};

const RotuloSuperior: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacidad = interpolate(
    frame,
    [0, 8, fps * 3 - 12, fps * 3],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 220,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: opacidad,
      }}
    >
      <span
        style={{
          padding: "22px 44px",
          borderRadius: 999,
          background: COLORES.acento,
          fontFamily: "system-ui, -apple-system, Helvetica, sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: COLORES.texto,
        }}
      >
        {texto}
      </span>
    </div>
  );
};
