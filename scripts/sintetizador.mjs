/**
 * Sintetizador chico, sin dependencias: osciladores, envolventes, filtro
 * y un delay. Alcanza para armar la musica del reel y escribirla a WAV.
 *
 * No es una libreria de audio seria, pero es codigo que se lee y se toca:
 * para cambiar el caracter de la musica se cambian notas y numeros, no
 * expresiones de ffmpeg de tres renglones.
 */

export const SR = 48000;

// --- Notas ------------------------------------------------------------

const SEMITONOS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "A1", "C#4", "Eb3" -> frecuencia en Hz. */
export const hz = (nota) => {
  const m = /^([A-G])([#b]?)(-?\d+)$/.exec(nota);
  if (!m) {
    throw new Error(`Nota invalida: ${nota}`);
  }
  const [, letra, alteracion, octava] = m;
  const midi =
    12 * (Number(octava) + 1) +
    SEMITONOS[letra] +
    (alteracion === "#" ? 1 : alteracion === "b" ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
};

// --- Osciladores ------------------------------------------------------

const seno = (fase) => Math.sin(2 * Math.PI * fase);

/** Sierra por suma de armonicos, cortada antes de Nyquist para no aliasear. */
const sierra = (fase, frecuencia) => {
  let v = 0;
  const maximo = Math.min(16, Math.floor(SR / 2 / Math.max(frecuencia, 1)));
  for (let k = 1; k <= maximo; k++) {
    v += Math.sin(2 * Math.PI * k * fase) / k;
  }
  return v * 0.55;
};

/** Triangular por armonicos impares: mas dulce que la sierra. */
const triangulo = (fase, frecuencia) => {
  let v = 0;
  const maximo = Math.min(11, Math.floor(SR / 2 / Math.max(frecuencia, 1)));
  for (let k = 1; k <= maximo; k += 2) {
    const signo = ((k - 1) / 2) % 2 === 0 ? 1 : -1;
    v += (signo * Math.sin(2 * Math.PI * k * fase)) / (k * k);
  }
  return v * 0.81;
};

const FORMAS = { seno, sierra, triangulo };

// --- Envolvente -------------------------------------------------------

/** ADSR clasico. Los tiempos van en segundos. */
const envolvente = (t, dur, { a = 0.005, d = 0.1, s = 0.6, r = 0.2 }) => {
  const finSostenido = Math.max(dur - r, a + d);
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < finSostenido) return s;
  const salida = (t - finSostenido) / Math.max(r, 1e-6);
  return Math.max(0, s * (1 - salida));
};

// --- Filtro pasabajos de dos polos ------------------------------------

const crearPasabajos = () => {
  let y1 = 0;
  let y2 = 0;
  return (x, corte) => {
    const a = 1 - Math.exp((-2 * Math.PI * corte) / SR);
    y1 += a * (x - y1);
    y2 += a * (y1 - y2);
    return y2;
  };
};

// --- Una voz ----------------------------------------------------------

/**
 * Genera una nota suelta como arreglo de muestras mono.
 *
 * `corte` puede ser un numero fijo o [desde, hasta] para que el filtro se
 * abra o se cierre mientras suena la nota.
 */
export const voz = ({
  nota,
  dur,
  forma = "sierra",
  adsr = {},
  corte = 12000,
  gan = 0.3,
  detune = 0,
}) => {
  const f = (typeof nota === "number" ? nota : hz(nota)) * Math.pow(2, detune / 1200);
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  const osc = FORMAS[forma];
  const filtro = crearPasabajos();
  const [corteDesde, corteHasta] = Array.isArray(corte) ? corte : [corte, corte];

  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const avance = i / n;
    fase += f / SR;
    const crudo = osc(fase, f);
    const filtrado = filtro(crudo, corteDesde + (corteHasta - corteDesde) * avance);
    salida[i] = filtrado * envolvente(t, dur, adsr) * gan;
  }
  return salida;
};

/** Ruido filtrado, para aire y transitorios. */
export const ruido = ({ dur, corte = 18000, gan = 0.3, caida = 20, pasaAltos = 0 }) => {
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  const filtro = crearPasabajos();
  const filtroAltos = crearPasabajos();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = Math.random() * 2 - 1;
    const bajo = filtro(x, corte);
    const v = pasaAltos > 0 ? bajo - filtroAltos(bajo, pasaAltos) : bajo;
    salida[i] = v * Math.exp(-caida * t) * gan;
  }
  return salida;
};

/** Barrido de frecuencia: sirve para el sub que cae en el impacto. */
export const barrido = ({ desde, hasta, dur, curva = 3, gan = 0.5, caida = 2 }) => {
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const avance = Math.min(i / n, 1);
    const f = hasta + (desde - hasta) * Math.pow(1 - avance, curva);
    fase += f / SR;
    salida[i] = Math.sin(2 * Math.PI * fase) * Math.exp(-caida * t) * gan;
  }
  return salida;
};

// --- Pista estereo ----------------------------------------------------

export class Pista {
  constructor(segundos) {
    this.n = Math.ceil(segundos * SR);
    this.L = new Float64Array(this.n);
    this.R = new Float64Array(this.n);
  }

  /** Mete un arreglo de muestras en el segundo indicado. `pan` va de -1 a 1. */
  poner(segundo, muestras, { gan = 1, pan = 0 } = {}) {
    const inicio = Math.round(segundo * SR);
    const ganL = gan * Math.cos(((pan + 1) * Math.PI) / 4);
    const ganR = gan * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < muestras.length; i++) {
      const j = inicio + i;
      if (j < 0 || j >= this.n) continue;
      this.L[j] += muestras[i] * ganL;
      this.R[j] += muestras[i] * ganR;
    }
    return this;
  }

  /** Eco con realimentacion: da sensacion de espacio sin ser un reverb real. */
  delay({ tiempo = 0.28, realimentacion = 0.34, mezcla = 0.3, ancho = 0.012 } = {}) {
    for (const [canal, desfase] of [[this.L, 0], [this.R, ancho]]) {
      const retardo = Math.round((tiempo + desfase) * SR);
      for (let i = retardo; i < this.n; i++) {
        canal[i] += canal[i - retardo] * realimentacion * mezcla;
      }
    }
    return this;
  }

  /**
   * Reverb de placa, tipo Schroeder: cuatro peines en paralelo que crean
   * la cola, y dos pasatodo en serie que la difuminan para que no suene
   * a eco repetido.
   *
   * Es lo que hace que un sonido corto no suene pegado al microfono. Los
   * tiempos de retardo son primos entre si a proposito: si fueran
   * multiplos, sus repeticiones coincidirian y se escucharia una nota.
   */
  reverb({ tiempo = 1.6, mezcla = 0.26, amplitud = 1, preDelay = 0.018 } = {}) {
    const PEINES = [1557, 1617, 1491, 1422];
    const PASATODO = [225, 556];
    const adelanto = Math.round(preDelay * SR);

    const procesar = (entrada, desfase) => {
      const seco = Float64Array.from(entrada);
      // La cola arranca unos milisegundos despues del sonido. Sin ese hueco
      // el sonido y su reverb se superponen y todo suena empastado.
      const fuente = new Float64Array(this.n);
      for (let n = adelanto; n < this.n; n++) {
        fuente[n] = seco[n - adelanto];
      }
      const humedo = new Float64Array(this.n);

      for (const base of PEINES) {
        const retardo = Math.round((base + desfase) * (SR / 44100));
        const realimentacion = Math.pow(10, (-3 * retardo) / (tiempo * SR));
        const buffer = new Float64Array(retardo);
        let i = 0;
        let filtrado = 0;
        for (let n = 0; n < this.n; n++) {
          const leido = buffer[i];
          humedo[n] += leido;
          // Un pasabajos dentro del lazo: los agudos se apagan antes que
          // los graves, igual que en una sala real.
          filtrado = leido * 0.26 + filtrado * 0.74;
          buffer[i] = fuente[n] + filtrado * realimentacion;
          i = (i + 1) % retardo;
        }
      }

      for (const base of PASATODO) {
        const retardo = Math.round((base + desfase) * (SR / 44100));
        const buffer = new Float64Array(retardo);
        let i = 0;
        for (let n = 0; n < this.n; n++) {
          const leido = buffer[i];
          const v = -humedo[n] + leido;
          buffer[i] = humedo[n] + leido * 0.5;
          humedo[n] = v;
          i = (i + 1) % retardo;
        }
      }

      for (let n = 0; n < this.n; n++) {
        entrada[n] = seco[n] * (1 - mezcla) + humedo[n] * mezcla * 0.25 * amplitud;
      }
    };

    // Desfase distinto por canal: es lo que abre la cola en estereo.
    procesar(this.L, 0);
    procesar(this.R, 23);
    return this;
  }

  /** Curva de volumen por tramos: [[segundo, ganancia], ...]. */
  curva(puntos) {
    for (let i = 0; i < this.n; i++) {
      const t = i / SR;
      let g = puntos[0][1];
      for (let k = 0; k < puntos.length - 1; k++) {
        const [t0, g0] = puntos[k];
        const [t1, g1] = puntos[k + 1];
        if (t >= t0 && t <= t1) {
          g = g0 + (g1 - g0) * ((t - t0) / Math.max(t1 - t0, 1e-6));
          break;
        }
        if (t > t1) g = g1;
      }
      this.L[i] *= g;
      this.R[i] *= g;
    }
    return this;
  }

  /** Limitador blando: evita que la suma de voces sature. */
  limitar(techo = 0.89) {
    let pico = 0;
    for (let i = 0; i < this.n; i++) {
      if (!Number.isFinite(this.L[i])) this.L[i] = 0;
      if (!Number.isFinite(this.R[i])) this.R[i] = 0;
      pico = Math.max(pico, Math.abs(this.L[i]), Math.abs(this.R[i]));
    }
    // Un filtro que se va de escala arruina la mezcla en silencio: al
    // normalizar por su pico, todo lo demas queda inaudible. Mejor avisar.
    if (pico > 50) {
      throw new Error(
        `La mezcla llego a un pico de ${pico.toExponential(2)}: ` +
          "hay un filtro inestable, no un problema de volumen.",
      );
    }
    if (pico > techo) {
      const g = techo / pico;
      for (let i = 0; i < this.n; i++) {
        this.L[i] *= g;
        this.R[i] *= g;
      }
    }
    // Saturacion suave para redondear los picos que quedan.
    for (let i = 0; i < this.n; i++) {
      this.L[i] = Math.tanh(this.L[i] * 1.08) * 0.94;
      this.R[i] = Math.tanh(this.R[i] * 1.08) * 0.94;
    }
    return this;
  }

  /** WAV PCM 16 bits estereo. */
  aWav() {
    const bytes = this.n * 4;
    const buf = Buffer.alloc(44 + bytes);
    buf.write("RIFF", 0);
    buf.writeUInt32LE(36 + bytes, 4);
    buf.write("WAVEfmt ", 8);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(2, 22);
    buf.writeUInt32LE(SR, 24);
    buf.writeUInt32LE(SR * 4, 28);
    buf.writeUInt16LE(4, 32);
    buf.writeUInt16LE(16, 34);
    buf.write("data", 36);
    buf.writeUInt32LE(bytes, 40);
    for (let i = 0; i < this.n; i++) {
      const a = Math.max(-1, Math.min(1, this.L[i]));
      const b = Math.max(-1, Math.min(1, this.R[i]));
      buf.writeInt16LE(Math.round(a * 32767), 44 + i * 4);
      buf.writeInt16LE(Math.round(b * 32767), 46 + i * 4);
    }
    return buf;
  }
}

// --- Filtro de estado variable ----------------------------------------

/**
 * Pasabanda biquad (formulas RBJ). Hace falta para las formantes de la
 * voz y el cuerpo de la percusion: un pasabajos no puede marcar un pico
 * en una frecuencia.
 *
 * Es un biquad y no un filtro de estado variable porque el de estado
 * variable se autooscila cuando la frecuencia sube: a 7 kHz con Q bajo
 * se va a infinito en pocas muestras. El biquad es estable para
 * cualquier frecuencia debajo de Nyquist.
 */
const crearPasabanda = (frecuencia, q) => {
  const f0 = Math.min(Math.max(frecuencia, 20), SR * 0.45);
  const w0 = (2 * Math.PI * f0) / SR;
  const alfa = Math.sin(w0) / (2 * Math.max(q, 0.05));

  const a0 = 1 + alfa;
  const b0 = alfa / a0;
  const b2 = -alfa / a0;
  const a1 = (-2 * Math.cos(w0)) / a0;
  const a2 = (1 - alfa) / a0;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x;
    y2 = y1; y1 = y;
    return y;
  };
};

// --- Percusion --------------------------------------------------------

/** Bombo: un seno que cae de golpe mas un click que le da ataque. */
export const bombo = ({ desde = 115, hasta = 44, dur = 0.42, gan = 0.9 } = {}) => {
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = hasta + (desde - hasta) * Math.exp(-38 * t);
    fase += f / SR;
    const cuerpo = Math.sin(2 * Math.PI * fase) * Math.exp(-7.5 * t);
    const click = (Math.random() * 2 - 1) * Math.exp(-900 * t) * 0.35;
    salida[i] = (cuerpo + click) * gan;
  }
  return salida;
};

/**
 * Palmas: no es un golpe sino cuatro muy seguidos, que es lo que hace
 * que suene a varias manos y no a una.
 */
export const palma = ({ dur = 0.5, gan = 0.5 } = {}) => {
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  const banda = crearPasabanda(1250, 1.6);
  const golpes = [0, 0.009, 0.019, 0.027];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let env = 0;
    for (const g of golpes) {
      if (t >= g) env = Math.max(env, Math.exp(-170 * (t - g)));
    }
    // Cola corta: el cuerpo de la sala donde se aplaude.
    env += Math.exp(-16 * t) * 0.3;
    salida[i] = banda(Math.random() * 2 - 1) * env * gan;
  }
  return salida;
};

/** Shaker o hi-hat: ruido agudo y muy corto. */
export const shaker = ({ dur = 0.08, gan = 0.3, caida = 70, brillo = 7000 } = {}) => {
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  const banda = crearPasabanda(brillo, 0.8);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    salida[i] = banda(Math.random() * 2 - 1) * Math.exp(-caida * t) * gan;
  }
  return salida;
};

/** Conga o tom: parecido al bombo pero mas agudo y con mas cola. */
export const conga = ({ desde = 320, hasta = 180, dur = 0.35, gan = 0.5 } = {}) => {
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = hasta + (desde - hasta) * Math.exp(-26 * t);
    fase += f / SR;
    const piel = (Math.random() * 2 - 1) * Math.exp(-150 * t) * 0.25;
    salida[i] = (Math.sin(2 * Math.PI * fase) * Math.exp(-11 * t) + piel) * gan;
  }
  return salida;
};

// --- Voz ---------------------------------------------------------------

/**
 * Vocal sintetizada por formantes: una sierra pasada por tres pasabanda
 * puestos donde el tracto vocal haria los picos de cada vocal.
 *
 * No suena a una persona grabada, suena a un sintetizador haciendo de
 * voz. En una mezcla con percusion funciona como gancho.
 */
const VOCALES = {
  a: [730, 1090, 2440],
  o: [570, 840, 2410],
  e: [530, 1840, 2480],
  u: [300, 870, 2240],
};

export const vocal = ({
  nota = "C4",
  vocal: cual = "a",
  dur = 0.4,
  gan = 0.3,
  vibrato = 4.5,
} = {}) => {
  const f0 = typeof nota === "number" ? nota : hz(nota);
  const formantes = VOCALES[cual] ?? VOCALES.a;
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  const filtros = formantes.map((f) => crearPasabanda(f, 7));
  const pesos = [1, 0.6, 0.28];

  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // El vibrato es gran parte de lo que hace que se lea como voz.
    const f = f0 * (1 + 0.012 * Math.sin(2 * Math.PI * vibrato * t));
    fase += f / SR;

    // Sierra cruda como fuente, igual que las cuerdas vocales.
    let fuente = 0;
    const maximo = Math.min(28, Math.floor(SR / 2 / f));
    for (let k = 1; k <= maximo; k++) {
      fuente += Math.sin(2 * Math.PI * k * fase) / k;
    }
    fuente *= 0.5;
    fuente += (Math.random() * 2 - 1) * 0.015; // un poco de aire

    let v = 0;
    for (let k = 0; k < filtros.length; k++) {
      v += filtros[k](fuente) * pesos[k];
    }

    const ataque = Math.min(t / 0.03, 1);
    const salidaEnv = Math.min((dur - t) / 0.09, 1);
    salida[i] = v * ataque * Math.max(salidaEnv, 0) * gan;
  }
  return salida;
};

// --- Campana FM --------------------------------------------------------

/**
 * Campana por FM. Es lo que da el timbre cristalino de un sonido de
 * producto: una portadora modulada por otra en una relacion no entera,
 * con el indice de modulacion cayendo mas rapido que el volumen.
 *
 * `relacion` fuera de los enteros (2.76, 3.47) da parciales inarmonicos,
 * que es lo que distingue una campana de un organo.
 */
export const campana = ({
  nota = "C5",
  dur = 2,
  relacion = 2.76,
  indice = 5,
  gan = 0.3,
  caida = 2.4,
  caidaIndice = 7,
} = {}) => {
  const f = typeof nota === "number" ? nota : hz(nota);
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  let fasePortadora = 0;
  let faseModuladora = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SR;
    faseModuladora += (f * relacion) / SR;
    const modulacion =
      Math.sin(2 * Math.PI * faseModuladora) * indice * Math.exp(-caidaIndice * t);
    fasePortadora += f / SR;
    const v = Math.sin(2 * Math.PI * fasePortadora + modulacion);
    // Ataque de 3 ms: sin esto el arranque chasquea.
    const ataque = Math.min(t / 0.003, 1);
    salida[i] = v * Math.exp(-caida * t) * ataque * gan;
  }
  return salida;
};

/** Glissando tonal: una nota que se desliza de una frecuencia a otra. */
export const glissando = ({
  desde = 200,
  hasta = 1800,
  dur = 0.8,
  gan = 0.25,
  curva = 2,
  forma = "seno",
} = {}) => {
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const avance = i / n;
    const f = desde + (hasta - desde) * Math.pow(avance, curva);
    fase += f / SR;
    const v =
      forma === "seno"
        ? Math.sin(2 * Math.PI * fase)
        : Math.sin(2 * Math.PI * fase) * 0.7 + Math.sin(4 * Math.PI * fase) * 0.3;
    salida[i] = v * gan;
  }
  return salida;
};

/** Aplica una envolvente de volumen por puntos a un arreglo de muestras. */
export const moldear = (muestras, puntos) => {
  const n = muestras.length;
  const salida = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const avance = i / n;
    let g = puntos[0][1];
    for (let k = 0; k < puntos.length - 1; k++) {
      const [a0, g0] = puntos[k];
      const [a1, g1] = puntos[k + 1];
      if (avance >= a0 && avance <= a1) {
        g = g0 + (g1 - g0) * ((avance - a0) / Math.max(a1 - a0, 1e-9));
        break;
      }
      if (avance > a1) g = g1;
    }
    salida[i] = muestras[i] * g;
  }
  return salida;
};

// --- Acabado -----------------------------------------------------------

/**
 * Realce de agudos de un polo. Es lo que da el "aire" de un sonido
 * producido: sube la banda alta sin tocar el cuerpo.
 */
export const brillo = (muestras, { desde = 4000, cantidad = 0.5 } = {}) => {
  const n = muestras.length;
  const salida = new Float64Array(n);
  const a = 1 - Math.exp((-2 * Math.PI * desde) / SR);
  let bajo = 0;
  for (let i = 0; i < n; i++) {
    bajo += a * (muestras[i] - bajo);
    const alto = muestras[i] - bajo;
    salida[i] = muestras[i] + alto * cantidad;
  }
  return salida;
};

/**
 * Ancho estereo por efecto Haas: el mismo sonido retrasado unos pocos
 * milisegundos en un canal se percibe ancho, no como dos sonidos.
 * Arriba de unos 25 ms deja de funcionar y se escucha como eco.
 */
export const ancho = (pista, muestras, { segundo = 0, ms = 11, gan = 1 } = {}) => {
  pista.poner(segundo, muestras, { gan, pan: -0.55 });
  pista.poner(segundo + ms / 1000, muestras, { gan: gan * 0.82, pan: 0.55 });
  return pista;
};

/**
 * Golpe de madera o plastico: un transitorio corto y un cuerpo que cae de
 * tono enseguida. Es el sonido de "algo que aparece", no de una campana.
 */
export const toque = ({
  desde = 940,
  hasta = 520,
  dur = 0.22,
  gan = 0.4,
  caida = 34,
  cuerpo = 0.55,
} = {}) => {
  const n = Math.ceil(dur * SR);
  const salida = new Float64Array(n);
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = hasta + (desde - hasta) * Math.exp(-70 * t);
    fase += f / SR;
    const nucleo = Math.sin(2 * Math.PI * fase);
    // Un segundo parcial apenas desafinado le saca el tono puro de seno.
    const color = Math.sin(2 * Math.PI * fase * 2.41) * 0.18;
    const ataque = Math.min(t / 0.0012, 1);
    salida[i] = (nucleo + color) * cuerpo * Math.exp(-caida * t) * ataque * gan;
  }
  return salida;
};
