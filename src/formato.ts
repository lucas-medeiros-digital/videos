/**
 * Formato unico para todos los videos: vertical de reel.
 * Si alguna vez necesitas horizontal, cambia esto en un solo lugar.
 */
export const FORMATO_VERTICAL = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/** Convierte segundos a frames usando los fps del proyecto. */
export const segundosAFrames = (segundos: number) =>
  Math.round(segundos * FORMATO_VERTICAL.fps);

/** Paleta base. Cambiala por los colores de tu marca. */
export const COLORES = {
  fondo: "#0B0D12",
  texto: "#FFFFFF",
  acento: "#FF4D4D",
  acentoSuave: "#FFD166",
  sombra: "rgba(0, 0, 0, 0.55)",
} as const;
