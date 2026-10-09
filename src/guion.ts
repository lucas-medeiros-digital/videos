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
  /** Entra la textura de fondo del tramo en que el agente trabaja. */
  textura: 140,
  /** Arranca la subida tonal del cierre, para que la nota final caiga sobre el logo. */
  marca: 352,
  /** Cae el primer mensaje sin responder. */
  primerMensaje: 1,
  /**
   * Arranca el barrido que anuncia al agente. Dura 30 frames y termina
   * justo sobre el golpe; los 10 frames de silencio que quedan entre la
   * ultima notificacion y el barrido son los que crean la expectativa.
   */
  barrido: 105,
  /** EL MOMENTO: entra el agente de WhatsApp. */
  agenteEntra: 133,
  /** El cartel del agente termina de asentarse. */
  agenteAterriza: 139,
  /** El agente despeja la bandeja: es un barrido corto. */
  limpiezaDesde: 145,
  limpiezaHasta: 166,
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
 * Cuando suena cada notificacion, y si va acentuada.
 *
 * Las cinco primeras van clavadas sobre las burbujas del video (medidas
 * cuadro por cuadro: caen en una grilla de 9 frames). Eso ancla el audio
 * a la imagen. A partir de ahi se despegan y los huecos se achican de 9
 * a 2 frames, hasta que dejan de leerse como golpes sueltos y se vuelven
 * una textura que no para de crecer. Es lo que cuenta la demanda que se
 * desborda, sin subir el volumen.
 *
 * El segundo valor marca las que coinciden con una burbuja: esas suenan
 * con mas cuerpo, y son las que sostienen la sensacion de sincronia.
 */
export const NOTIFICACIONES: ReadonlyArray<readonly [number, boolean]> = [
  [0, true], [6, true], [14, true], [23, true], [32, true], [40, true],
  [48, false], [55, false], [62, false], [68, true], [74, false],
  [80, false], [85, true], [90, false], [95, true], [99, false],
  [103, false], [107, false], [111, false], [114, false], [117, false],
  [120, false], [123, false], [125, false], [128, false], [130, false],
];

/**
 * Cuando el agente despeja la bandeja. Tambien medido del video: pasa en
 * un barrido corto, no repartido a lo largo de varios segundos.
 */
export const MENSAJES_RESUELTOS: number[] = [145, 149, 160, 166].map((f) => f - 2);

/** Hasta donde llega el reel dentro de la version larga: despues del
 *  titular y antes de que aparezca el logo, que alli cierra todo el video. */
export const REEL_EN_LARGO = 390;

/** Paleta tomada del video: verde oscuro de fondo, dorado de marca. */
export const MARCA = {
  verde: "#0E2A20",
  verdeClaro: "#1C4A38",
  dorado: "#C9A227",
  doradoClaro: "#E8C76A",
  blanco: "#FFFFFF",
} as const;
