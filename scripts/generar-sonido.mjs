/**
 * Diseño de sonido y musica del reel.
 *
 *   node scripts/generar-sonido.mjs
 *
 * La referencia es un film de producto, no un anuncio: cada sonido
 * armado por capas, con aire alrededor, y una musica que acompaña sin
 * pelearle al diseño de sonido.
 *
 * Cuatro reglas que ordenan toda la paleta:
 *   - Tres capas por efecto: transitorio, cuerpo y cola. Un sonido de una
 *     sola capa siempre suena barato, por bueno que sea el timbre.
 *   - Todo lleva reverb con pre-delay. El hueco entre el sonido y su cola
 *     es lo que deja escuchar el espacio en vez de empastar.
 *   - Ancho estereo por Haas, no por paneo: el mismo sonido corrido unos
 *     milisegundos se percibe ancho, no como dos sonidos.
 *   - La tension se construye con ritmo y silencio, nunca con volumen.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import {
  Pista, campana, glissando, moldear, ruido, voz, barrido, toque,
  brillo, ancho, hz,
} from "./sintetizador.mjs";

const DESTINO = "public/audio";
mkdirSync(DESTINO, { recursive: true });

const guardar = (nombre, pista, techo = 0.86) => {
  writeFileSync(`${DESTINO}/${nombre}`, pista.limitar(techo).aWav());
  console.log(`  ${nombre.padEnd(24)} ${(pista.n / 48000).toFixed(2)}s`);
};

// ======================================================================
// EFECTOS
// ======================================================================

console.log("Notificaciones...");

/**
 * Notificacion: un toque corto y seco, no una campana.
 *
 * Tres capas: el chasquido que define el instante, el cuerpo de madera
 * que cae de tono, y una chispa aguda muy corta que le da el acabado.
 * Suenan veintiseis veces en cuatro segundos, asi que cada una tiene que
 * ser breve y no dejar cola: lo que se acumula es el ritmo, no el sonido.
 */
const notificacion = ({ tono, acento }) => {
  const p = new Pista(0.55);
  const fuerza = acento ? 1 : 0.72;

  p.poner(0, ruido({ dur: 0.012, corte: 15000, pasaAltos: 3000,
                     gan: 0.3 * fuerza, caida: 420 }));
  ancho(p, brillo(toque({ desde: tono, hasta: tono * 0.55, dur: 0.2,
                          gan: 0.52 * fuerza, caida: 38 }),
                  { desde: 5000, cantidad: 0.4 }),
        { ms: 9, gan: 0.9 });
  p.poner(0.002, campana({ nota: tono * 3, dur: 0.14, relacion: 1.97, indice: 1.1,
                           caida: 44, caidaIndice: 90, gan: 0.1 * fuerza }));

  // Solo las acentuadas llevan algo de grave: es lo que las hace destacar
  // entre las otras sin tener que subirles el volumen.
  if (acento) {
    p.poner(0, voz({ nota: "C3", dur: 0.1, forma: "seno", gan: 0.1,
                     adsr: { a: 0.001, d: 0.04, s: 0.08, r: 0.05 } }));
  }

  p.reverb({ tiempo: 0.7, mezcla: 0.15, preDelay: 0.012 });
  return p;
};

[880, 988, 1108].forEach((tono, i) => {
  guardar(`notificacion-${i + 1}.wav`, notificacion({ tono, acento: false }));
  guardar(`notificacion-${i + 1}-acento.wav`, notificacion({ tono, acento: true }));
});

console.log("La aparicion del agente...");

/** Barrido: aire que sube, un tono que lo sigue y un hueco al final. */
{
  const p = new Pista(1.1);
  const aire = moldear(
    ruido({ dur: 0.95, corte: 7600, pasaAltos: 800, gan: 0.3, caida: 0 }),
    [[0, 0], [0.55, 0.45], [0.88, 1], [1, 0]],
  );
  ancho(p, aire, { ms: 17 });
  p.poner(0, moldear(
    glissando({ desde: 300, hasta: 2600, dur: 0.95, gan: 0.14, curva: 2.6 }),
    [[0, 0], [0.85, 1], [1, 0]],
  ));
  // Una quinta sostenida debajo: anticipa la nota del golpe.
  p.poner(0.25, moldear(voz({ nota: "G3", dur: 0.7, forma: "sierra", gan: 0.075,
                              corte: [400, 1800], adsr: { a: 0.3, d: 0.2, s: 0.7, r: 0.2 } }),
                        [[0, 0], [0.9, 1], [1, 0]]));
  p.reverb({ tiempo: 1.6, mezcla: 0.2, preDelay: 0.02 });
  guardar("barrido.wav", p);
}

/**
 * La firma del agente. Cuatro capas con un trabajo cada una:
 *   chasquido  -> define el instante exacto
 *   sub        -> peso, contenido: no es una explosion
 *   campanas   -> el timbre cristalino, en quinta justa
 *   cola       -> el aire que deja un producto caro
 */
{
  const p = new Pista(3.4);

  p.poner(0, brillo(ruido({ dur: 0.028, corte: 17000, pasaAltos: 4000,
                            gan: 0.4, caida: 240 }), { desde: 8000, cantidad: 0.5 }));
  p.poner(0, barrido({ desde: 82, hasta: 44, dur: 2.0, curva: 2.6, gan: 0.54, caida: 3.0 }));

  p.poner(0.004, campana({ nota: "C5", dur: 3.2, relacion: 2.76, indice: 4.2,
                           caida: 1.8, caidaIndice: 6, gan: 0.3 }), { pan: -0.24 });
  p.poner(0.014, campana({ nota: "G5", dur: 3.0, relacion: 3.47, indice: 3.4,
                           caida: 2.2, caidaIndice: 8, gan: 0.19 }), { pan: 0.28 });
  p.poner(0.03, campana({ nota: "C6", dur: 2.5, relacion: 2.01, indice: 2.2,
                          caida: 3.0, caidaIndice: 11, gan: 0.11 }));

  // Cuerpo armonico debajo de las campanas: las apoya y las vuelve calidas.
  p.poner(0.006, voz({ nota: "C4", dur: 2.2, forma: "sierra", gan: 0.085,
                       corte: [3000, 500],
                       adsr: { a: 0.004, d: 0.5, s: 0.3, r: 1.1 } }));

  ancho(p, moldear(ruido({ dur: 0.45, corte: 12000, pasaAltos: 2400, gan: 0.14, caida: 0 }),
                   [[0, 1], [1, 0]]), { ms: 13 });
  p.reverb({ tiempo: 2.8, mezcla: 0.3, preDelay: 0.024 });
  guardar("activacion.wav", p);
}

console.log("El agente trabajando...");

/** Clic de interfaz: corto, preciso, tactil. */
{
  const p = new Pista(0.45);
  p.poner(0, brillo(ruido({ dur: 0.016, corte: 14000, pasaAltos: 4500,
                            gan: 0.26, caida: 340 }), { desde: 7000, cantidad: 0.4 }));
  ancho(p, toque({ desde: 1700, hasta: 1100, dur: 0.1, gan: 0.26, caida: 70 }), { ms: 7 });
  p.reverb({ tiempo: 0.9, mezcla: 0.17, preDelay: 0.01 });
  guardar("clic.wav", p);
}

/** Confirmacion: dos notas que suben, al fondo. */
{
  const p = new Pista(0.9);
  p.poner(0, campana({ nota: "E6", dur: 0.42, relacion: 2.01, indice: 1.6,
                       caida: 13, caidaIndice: 30, gan: 0.17 }), { pan: -0.22 });
  p.poner(0.055, campana({ nota: "B6", dur: 0.52, relacion: 2.01, indice: 1.3,
                           caida: 11, caidaIndice: 28, gan: 0.12 }), { pan: 0.22 });
  p.reverb({ tiempo: 1.3, mezcla: 0.24, preDelay: 0.014 });
  guardar("confirmacion.wav", p);
}

console.log("Cero consultas y cierre...");

/** Cero consultas: cristalino arriba, calido abajo. Contenido. */
{
  const p = new Pista(3.0);
  for (const [nota, g, d, pan] of [
    ["E6", 0.25, 2.6, -0.22], ["G6", 0.17, 2.4, 0.24], ["C7", 0.1, 2.0, 0],
  ]) {
    p.poner(0, campana({ nota, dur: d, relacion: 2.01, indice: 2.4,
                         caida: 2.5, caidaIndice: 9, gan: g }), { pan });
  }
  p.poner(0, voz({ nota: "C3", dur: 1.8, forma: "seno", gan: 0.21,
                   adsr: { a: 0.008, d: 0.5, s: 0.3, r: 0.9 } }));
  p.poner(0.002, voz({ nota: "C4", dur: 1.2, forma: "sierra", gan: 0.06,
                       corte: [2400, 600], adsr: { a: 0.005, d: 0.4, s: 0.2, r: 0.6 } }));
  p.reverb({ tiempo: 2.6, mezcla: 0.3, preDelay: 0.02 });
  guardar("logro.wav", p);
}

/** Cierre de marca: una subida y una nota final que resuelve, con aire. */
{
  const p = new Pista(4.4);
  p.poner(0, moldear(
    glissando({ desde: 180, hasta: 262, dur: 1.5, gan: 0.13, curva: 0.6, forma: "doble" }),
    [[0, 0], [0.7, 1], [1, 0.3]],
  ));
  ancho(p, moldear(ruido({ dur: 1.5, corte: 4600, pasaAltos: 600, gan: 0.085, caida: 0 }),
                   [[0, 0], [0.8, 1], [1, 0]]), { ms: 19 });

  p.poner(1.35, campana({ nota: "C5", dur: 2.8, relacion: 2.76, indice: 3,
                          caida: 1.6, caidaIndice: 7, gan: 0.28 }), { pan: -0.16 });
  p.poner(1.37, campana({ nota: "G5", dur: 2.6, relacion: 2.01, indice: 2,
                          caida: 2.0, caidaIndice: 9, gan: 0.15 }), { pan: 0.2 });
  p.poner(1.35, voz({ nota: "C3", dur: 2.4, forma: "seno", gan: 0.16,
                      adsr: { a: 0.01, d: 0.7, s: 0.25, r: 1.3 } }));
  p.reverb({ tiempo: 3.2, mezcla: 0.32, preDelay: 0.026 });
  guardar("marca.wav", p);
}

// ======================================================================
// MUSICA
// ======================================================================

/**
 * Pad: tres sierras por nota, apenas desafinadas entre si.
 *
 * Ese desafine minimo es todo el secreto de un pad calido: las tres
 * ondas entran y salen de fase lentamente y el sonido "respira". Una
 * sola sierra, por buen filtro que tenga, suena plana y barata.
 */
const pad = (p, { notas, desde, dur, gan = 0.08, corte = [500, 1500] }) => {
  notas.forEach((nota, i) => {
    const lugar = notas.length > 1 ? i / (notas.length - 1) : 0.5;
    for (const detune of [-7, 0, 7]) {
      p.poner(desde + i * 0.012,
        voz({ nota, dur, forma: "sierra", gan: gan / 3, corte, detune,
              adsr: { a: Math.min(dur * 0.3, 1.1), d: dur * 0.25, s: 0.82,
                      r: dur * 0.4 } }),
        { pan: (lugar - 0.5) * 0.85 + detune / 220 });
    }
  });
};

/** Mallet: la nota puntual del motivo. Corta, con brillo y cola. */
const mallet = (p, { nota, desde, gan = 0.16, dur = 1.6, pan = 0 }) => {
  p.poner(desde, campana({ nota, dur, relacion: 3.01, indice: 1.9,
                           caida: 3.4, caidaIndice: 16, gan }), { pan });
};

/** Sub: el cuerpo grave. No se escucha como nota, se siente. */
const sub = (p, { nota, desde, dur, gan = 0.2 }) => {
  p.poner(desde, voz({ nota, dur, forma: "seno", gan,
                       adsr: { a: 0.12, d: dur * 0.3, s: 0.72, r: dur * 0.35 } }));
};

/**
 * El motivo: cinco notas que vuelven cada vez que hay que sostener una
 * escena. Es lo unico que se recuerda de la musica, asi que no cambia.
 */
const MOTIVO = ["C5", "E5", "G5", "E5", "D5"];

const motivo = (p, { desde, paso = 0.42, gan = 0.15, veces = 1, notas = MOTIVO }) => {
  for (let v = 0; v < veces; v++) {
    notas.forEach((nota, i) => {
      const t = desde + (v * notas.length + i) * paso;
      mallet(p, { nota, desde: t, gan: gan * (i === 0 ? 1 : 0.78),
                  pan: (i % 2 === 0 ? -1 : 1) * 0.22 });
    });
  }
};

/**
 * Arma la musica a partir de una lista de secciones.
 *
 * Cada seccion dice que acorde sostiene y con que densidad. El arco
 * armonico sigue al video: Do suspendido mientras se acumulan las
 * consultas (ni mayor ni menor: no resuelve), Do mayor cuando entra el
 * agente, Fa mayor cuando respira el titular, y Do mayor otra vez en el
 * cierre.
 */
const construirMusica = ({ duracion, secciones, finalEn }) => {
  const p = new Pista(duracion);

  for (const s of secciones) {
    const dur = s.hasta - s.desde;
    pad(p, { notas: s.acorde, desde: s.desde, dur,
             gan: s.pad ?? 0.08, corte: s.corte ?? [500, 1500] });
    if (s.sub) {
      sub(p, { nota: s.sub, desde: s.desde, dur, gan: s.subGan ?? 0.18 });
    }
    if (s.motivo) {
      motivo(p, { desde: s.desde + (s.motivoDesde ?? 0.2),
                  veces: s.motivo, gan: s.motivoGan ?? 0.14,
                  paso: s.paso ?? 0.42 });
    }
    for (const [nota, cuando, g] of s.notas ?? []) {
      mallet(p, { nota, desde: s.desde + cuando, gan: g ?? 0.12, dur: 2.4 });
    }
  }

  // Eco a contratiempo: separa el motivo del pad y da profundidad.
  p.delay({ tiempo: 0.315, realimentacion: 0.28, mezcla: 0.22 });
  p.reverb({ tiempo: 3.4, mezcla: 0.3, preDelay: 0.03 });
  p.curva([[0, 0], [0.8, 1], [finalEn - 1.6, 1], [finalEn, 0]]);
  return p;
};

console.log("Musica...");

// Los dos videos comparten el arranque, asi que comparten estas secciones.
const APERTURA = [
  // Do suspendido: no resuelve, y esa falta de resolucion es la tension.
  { desde: 0, hasta: 4.6, acorde: ["C3", "D4", "G4"], pad: 0.055,
    corte: [300, 620], notas: [["G4", 1.4, 0.07], ["C5", 3.0, 0.06]] },
  // Entra el agente: resuelve a Do mayor, abre el filtro y entra el sub.
  { desde: 4.43, hasta: 7.9, acorde: ["C3", "E4", "G4", "C5"], pad: 0.1,
    corte: [900, 2400], sub: "C2", motivo: 1, motivoDesde: 0.35, motivoGan: 0.15 },
  { desde: 7.8, hasta: 10.2, acorde: ["C3", "G4", "C5", "E5"], pad: 0.095,
    corte: [1100, 2200], sub: "C2", motivo: 1, motivoDesde: 0.1, motivoGan: 0.13 },
  // El titular respira: Fa mayor, mas calido, sin motivo.
  { desde: 10.1, hasta: 13.2, acorde: ["F3", "A4", "C5"], pad: 0.09,
    corte: [800, 1700], sub: "F2", subGan: 0.15 },
];

{
  const p = construirMusica({
    duracion: 16.2,
    finalEn: 15.9,
    secciones: [
      ...APERTURA,
      // Cierre de marca: Do mayor con novena, que es lo que le da el brillo.
      { desde: 13.0, hasta: 16.2, acorde: ["C3", "G4", "C5", "D5", "E5"],
        pad: 0.11, corte: [1000, 2000], sub: "C2",
        notas: [["C5", 0.5, 0.15], ["G5", 1.5, 0.1]] },
    ],
  });
  guardar("musica-corta.wav", p, 0.82);
}

{
  const p = construirMusica({
    duracion: 46,
    finalEn: 45.4,
    secciones: [
      ...APERTURA,
      // El puente: vuelve el Do suspendido, otra vez sin resolver.
      { desde: 13.0, hasta: 16.2, acorde: ["C3", "D4", "G4"], pad: 0.075,
        corte: [600, 1200], notas: [["G4", 0.9, 0.1]] },
      // Los cuatro pasos: una vuelta armonica por paso, el motivo sostiene.
      { desde: 16.0, hasta: 20.6, acorde: ["A3", "C5", "E5"], pad: 0.085,
        corte: [800, 1800], sub: "A1", motivo: 2, motivoGan: 0.12 },
      { desde: 20.4, hasta: 25.1, acorde: ["F3", "A4", "C5"], pad: 0.085,
        corte: [850, 1900], sub: "F2", motivo: 2, motivoGan: 0.12 },
      { desde: 24.9, hasta: 29.6, acorde: ["C3", "E4", "G4", "C5"], pad: 0.09,
        corte: [900, 2000], sub: "C2", motivo: 2, motivoGan: 0.13 },
      { desde: 29.4, hasta: 34.1, acorde: ["G3", "B4", "D5"], pad: 0.09,
        corte: [900, 2100], sub: "G1", motivo: 2, motivoGan: 0.13 },
      // El antes: La menor, se cierra el filtro.
      { desde: 33.9, hasta: 37.6, acorde: ["A3", "C5", "E5"], pad: 0.08,
        corte: [550, 1200], sub: "A1" },
      // El despues: Do mayor, se abre.
      { desde: 37.4, hasta: 41.6, acorde: ["C3", "E4", "G4", "C5"], pad: 0.1,
        corte: [1000, 2300], sub: "C2", motivo: 1, motivoGan: 0.14 },
      // Cierre de marca.
      { desde: 41.4, hasta: 46, acorde: ["C3", "G4", "C5", "D5", "E5"],
        pad: 0.11, corte: [1000, 2000], sub: "C2",
        notas: [["C5", 0.6, 0.15], ["G5", 1.7, 0.1]] },
    ],
  });
  guardar("musica-larga.wav", p, 0.82);
}

console.log("\nListo.");
