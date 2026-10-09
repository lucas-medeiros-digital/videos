import React from "react";
import { Composition } from "remotion";
import { FORMATO_VERTICAL, segundosAFrames } from "./formato";
import { PALABRAS_EJEMPLO } from "./datos/subtitulos";
import { VideoConSubtitulos } from "./plantillas/VideoConSubtitulos";
import { IntroTitulo } from "./plantillas/IntroTitulo";
import { GraficoBarras } from "./plantillas/GraficoBarras";
import { ReelAgente } from "./plantillas/ReelAgente";
import { REEL } from "./guion";

export const Root: React.FC = () => {
  return (
    <>
      {/* El reel de Vinculo con banda sonora y efectos encima. */}
      <Composition
        id="ReelAgente"
        component={ReelAgente}
        durationInFrames={REEL.duracionFrames}
        {...FORMATO_VERTICAL}
      />

      {/* Plantilla principal: tu video del telefono con subtitulos encima. */}
      <Composition
        id="VideoConSubtitulos"
        component={VideoConSubtitulos}
        durationInFrames={segundosAFrames(8)}
        {...FORMATO_VERTICAL}
        defaultProps={{
          archivoVideo: null,
          palabras: PALABRAS_EJEMPLO,
          rotulo: "Claude + Remotion",
          ajusteSubtitulos: 0,
        }}
      />

      {/* Apertura con titulo y dos logos. */}
      <Composition
        id="IntroTitulo"
        component={IntroTitulo}
        durationInFrames={segundosAFrames(4)}
        {...FORMATO_VERTICAL}
        defaultProps={{
          titulo: "Videos sin editor",
          subtitulo: "Claude Code + Remotion",
          logoIzquierda: undefined,
          logoDerecha: undefined,
        }}
      />

      {/* Grafico de barras animado. */}
      <Composition
        id="GraficoBarras"
        component={GraficoBarras}
        durationInFrames={segundosAFrames(5)}
        {...FORMATO_VERTICAL}
        defaultProps={{
          titulo: "Horas de edicion por video",
          sufijo: "h",
          barras: [
            { etiqueta: "Antes", valor: 6 },
            { etiqueta: "Con IA", valor: 2 },
            { etiqueta: "Hoy", valor: 1 },
          ],
        }}
      />
    </>
  );
};
