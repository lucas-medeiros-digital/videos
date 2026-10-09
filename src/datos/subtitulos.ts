/**
 * Subtitulos palabra por palabra.
 * `desde` y `hasta` van en segundos, medidos sobre el audio del video.
 *
 * Para generarlos automaticamente desde tu propio audio, mira la seccion
 * "Subtitulos automaticos" en GUIA.md.
 */
export type Palabra = {
  texto: string;
  desde: number;
  hasta: number;
};

export const PALABRAS_EJEMPLO: Palabra[] = [
  { texto: "Esto", desde: 0.0, hasta: 0.32 },
  { texto: "lo", desde: 0.32, hasta: 0.48 },
  { texto: "hice", desde: 0.48, hasta: 0.85 },
  { texto: "sin", desde: 0.85, hasta: 1.15 },
  { texto: "abrir", desde: 1.15, hasta: 1.55 },
  { texto: "un", desde: 1.55, hasta: 1.7 },
  { texto: "editor", desde: 1.7, hasta: 2.25 },
  { texto: "de", desde: 2.25, hasta: 2.4 },
  { texto: "video", desde: 2.4, hasta: 2.95 },
  { texto: "Solo", desde: 3.3, hasta: 3.7 },
  { texto: "le", desde: 3.7, hasta: 3.85 },
  { texto: "escribi", desde: 3.85, hasta: 4.35 },
  { texto: "lo", desde: 4.35, hasta: 4.5 },
  { texto: "que", desde: 4.5, hasta: 4.7 },
  { texto: "queria", desde: 4.7, hasta: 5.2 },
];
