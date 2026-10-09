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
   * Arranca la percusion. Antes del agente no hay musica: solo los tics de
   * los mensajes sobre el silencio, que es lo que construye el agobio.
   */
  musica: 133,
  /** Cae el primer mensaje sin responder. */
  primerMensaje: 1,
  /** Arranca el riser: se nota que esto se va de las manos. */
  riser: 100,
  /** Whoosh de entrada, justo antes del golpe. */
  whoosh: 126,
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
 * Cuando llega cada mensaje, medido sobre el video: se conto el area
 * blanca cuadro por cuadro y se buscaron los escalones.
 *
 * El video las tira en una grilla pareja de 9 frames (0,3 s), no
 * acelerando como parecia a simple vista. Los tics van dos frames antes
 * del pico detectado: el sonido que llega junto con la imagen se percibe
 * tarde, y adelantarlo un poco es lo que lo hace sentir pegado.
 */
const BURBUJAS = [1, 7, 15, 24, 33, 42, 51, 59, 69, 78, 87, 96];
const ADELANTO = 2;

export const TICS_MENSAJES: number[] = BURBUJAS.map((f) =>
  Math.max(0, f - ADELANTO),
);

/**
 * Cuando el agente despeja la bandeja. Tambien medido del video: pasa en
 * un barrido corto, no repartido a lo largo de varios segundos.
 */
export const SWISHES_RESUELTOS: number[] = [145, 149, 160, 166].map(
  (f) => f - ADELANTO,
);

/** Paleta tomada del video: verde oscuro de fondo, dorado de marca. */
export const MARCA = {
  verde: "#0E2A20",
  verdeClaro: "#1C4A38",
  dorado: "#C9A227",
  doradoClaro: "#E8C76A",
  blanco: "#FFFFFF",
} as const;
