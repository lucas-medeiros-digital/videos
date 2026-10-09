/**
 * Guion del reel: en que frame pasa cada cosa.
 *
 * Los numeros salieron de analizar el video original cuadro por cuadro, a
 * 30 fps. Si cambias el video, estos son los unicos numeros que hay que
 * volver a tocar: los efectos y el audio se acomodan solos.
 */

export const REEL = {
  archivo: "reel-agente.mp4",
  duracionFrames: 465, // 15.5 s
} as const;

export const MOMENTO = {
  /** El telefono aparece en pantalla. */
  inicio: 0,
  /**
   * Arranca la musica. No es un numero cualquiera: a 120 BPM la negra dura
   * 15 frames, asi que desde el 13 el golpe del agente (frame 133) cae
   * justo sobre el primer tiempo del tercer compas.
   */
  musica: 13,
  /** Cae el primer mensaje sin responder. Suena apenas antes de que se vea
   *  la burbuja: el oido se adelanta al ojo y la llegada se siente mejor. */
  primerMensaje: 5,
  /** Arranca el riser: se nota que esto se va de las manos. */
  riser: 100,
  /** Whoosh de entrada, justo antes del golpe. */
  whoosh: 126,
  /** EL MOMENTO: entra el agente de WhatsApp. */
  agenteEntra: 133,
  /** El cartel del agente termina de asentarse. */
  agenteAterriza: 139,
  /** El agente empieza a despejar la bandeja. */
  limpiezaDesde: 158,
  limpiezaHasta: 232,
  /** El contador llega a cero. */
  contadorEnCero: 234,
  /** Aparece el tilde verde. */
  check: 237,
  /** Entra el titular "Ninguna consulta se te escapa". */
  titular: 303,
  titularCompleto: 318,
  titularSale: 384,
  /** Cierre de marca. */
  logo: 393,
  boton: 399,
  tagline: 408,
} as const;

/**
 * Cuando suena cada mensaje que llega. Los golpes se van juntando: el
 * exponente menor a 1 hace que los huecos se achiquen hacia el final.
 */
export const TICS_MENSAJES: number[] = Array.from({ length: 20 }, (_, i) => {
  const avance = i / 19;
  return Math.round(
    MOMENTO.primerMensaje +
      (MOMENTO.agenteEntra - 6 - MOMENTO.primerMensaje) * Math.pow(avance, 0.62),
  );
});

/**
 * Cuando suena cada mensaje que el agente resuelve. Al reves que los tics:
 * arrancan seguidos y se van espaciando mientras la bandeja se vacia.
 */
export const SWISHES_RESUELTOS: number[] = Array.from({ length: 9 }, (_, i) => {
  const avance = i / 8;
  return Math.round(
    MOMENTO.limpiezaDesde +
      (MOMENTO.limpiezaHasta - MOMENTO.limpiezaDesde) * Math.pow(avance, 1.5),
  );
});

/** Paleta tomada del video: verde oscuro de fondo, dorado de marca. */
export const MARCA = {
  verde: "#0E2A20",
  verdeClaro: "#1C4A38",
  dorado: "#C9A227",
  doradoClaro: "#E8C76A",
  blanco: "#FFFFFF",
} as const;
