/**
 * Arma las camas musicales y el golpe del agente, y las escribe a
 * public/audio/.
 *
 *   node scripts/generar-musica.mjs
 *
 * Todo va a 120 BPM (negra = 0,5 s = 15 frames). La cama de tension
 * arranca en el frame 13 justamente para que el golpe del agente, en el
 * frame 133, caiga sobre el primer tiempo del tercer compas.
 *
 * El arco armonico es el del video: La menor mientras las consultas se
 * amontonan, Do mayor cuando entra el agente y Fa mayor en el cierre de
 * marca. El golpe es el acorde de Do: la tension que resuelve.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { Pista, voz, ruido, barrido, hz } from "./sintetizador.mjs";

const DESTINO = "public/audio";
const NEGRA = 0.5;
const CORCHEA = NEGRA / 2;

mkdirSync(DESTINO, { recursive: true });

const guardar = (nombre, pista) => {
  const wav = pista.limitar().aWav();
  writeFileSync(`${DESTINO}/${nombre}`, wav);
  console.log(`  ${nombre.padEnd(24)} ${(pista.n / 48000).toFixed(2)}s`);
};

/** Suma dos arreglos de muestras. */
const sumar = (a, b) => {
  const salida = new Float64Array(Math.max(a.length, b.length));
  for (let i = 0; i < salida.length; i++) {
    salida[i] = (a[i] ?? 0) + (b[i] ?? 0);
  }
  return salida;
};

/** Bajo con pulso: una nota corta y redonda en cada tiempo. */
const pulsoDeBajo = (pista, { nota, tiempos, desde = 0, gan = 0.5, corte = 600 }) => {
  // Se genera una sola vez y se repite: todos los golpes son iguales.
  const cuerpo = voz({
    nota, dur: NEGRA * 0.92, forma: "sierra", gan: gan * 0.55,
    corte: [corte * 1.6, corte * 0.5],
    adsr: { a: 0.004, d: 0.14, s: 0.25, r: 0.18 },
  });
  const sub = voz({
    nota, dur: NEGRA * 0.92, forma: "seno", gan: gan * 0.75,
    adsr: { a: 0.004, d: 0.18, s: 0.3, r: 0.2 },
  });
  const golpe = sumar(cuerpo, sub);
  for (let i = 0; i < tiempos; i++) {
    pista.poner(desde + i * NEGRA, golpe);
  }
};

/** Arpegio de corcheas: le da nervio a la tension y prolijidad al after. */
const arpegio = (pista, { notas, pasos, desde = 0, gan = 0.2, forma = "triangulo", corte = 3000 }) => {
  for (let i = 0; i < pasos; i++) {
    pista.poner(desde + i * CORCHEA,
      voz({ nota: notas[i % notas.length], dur: CORCHEA * 1.6, forma, gan,
            corte, adsr: { a: 0.003, d: 0.09, s: 0.12, r: 0.1 } }),
      { pan: i % 2 === 0 ? -0.25 : 0.25 });
  }
};

/** Acorde sostenido, de colchon. */
const acorde = (pista, { notas, dur, desde = 0, gan = 0.12, corte = 1400, adsr }) => {
  notas.forEach((nota, i) => {
    pista.poner(desde,
      voz({ nota, dur, forma: "sierra", gan, corte,
            detune: (i - notas.length / 2) * 5,
            adsr: adsr ?? { a: 0.35, d: 0.5, s: 0.8, r: dur * 0.3 } }),
      { pan: (i / Math.max(notas.length - 1, 1)) * 1.1 - 0.55 });
  });
};

console.log("Camas musicales...");

// --- 1. Tension: La menor, 8 tiempos que se van apretando ---------------
{
  const p = new Pista(4.35);
  pulsoDeBajo(p, { nota: "A1", tiempos: 8, gan: 0.62, corte: 520 });
  acorde(p, { notas: ["A2", "C3", "E3"], dur: 4.0, gan: 0.1, corte: [380, 1500] });
  // El arpegio entra recien en el tercer tiempo: primero el agobio, despues los nervios.
  arpegio(p, { notas: ["A4", "C5", "E5", "C5"], pasos: 12, desde: NEGRA * 2,
               gan: 0.13, corte: 2600 });
  p.delay({ tiempo: CORCHEA * 1.5, realimentacion: 0.3, mezcla: 0.26 });
  // Sube parejo y corta seco en el tiempo 8, para dejarle aire al golpe.
  p.curva([[0, 0.42], [3.4, 1.0], [3.95, 1.0], [4.15, 0]]);
  guardar("cama-tension.wav", p);
}

// --- 2. Resolucion: Do mayor, el agente trabajando ----------------------
{
  const p = new Pista(5.9);
  pulsoDeBajo(p, { nota: "C2", tiempos: 11, gan: 0.5, corte: 700 });
  acorde(p, { notas: ["C3", "E3", "G3"], dur: 5.6, gan: 0.09, corte: [900, 1900] });
  arpegio(p, { notas: ["C4", "E4", "G4", "B4", "G4", "E4"], pasos: 22,
               gan: 0.15, corte: 4200 });
  p.delay({ tiempo: CORCHEA * 3, realimentacion: 0.32, mezcla: 0.3 });
  p.curva([[0, 0.3], [0.5, 1.0], [5.1, 1.0], [5.85, 0]]);
  guardar("cama-resolucion.wav", p);
}

// --- 3. Cierre: Fa a Do, sin pulso, que respire -------------------------
{
  const p = new Pista(5.9);
  const progresion = [
    { notas: ["F3", "A3", "C4"], desde: 0.0, dur: 2.0 },
    { notas: ["C3", "E3", "G3"], desde: 1.8, dur: 2.2 },
    { notas: ["F3", "A3", "C4", "F4"], desde: 3.6, dur: 2.3 },
  ];
  for (const a of progresion) {
    acorde(p, { ...a, gan: 0.13, corte: [700, 1600],
                adsr: { a: 0.5, d: 0.6, s: 0.75, r: a.dur * 0.45 } });
  }
  p.poner(0, voz({ nota: "F2", dur: 5.4, forma: "seno", gan: 0.16,
                   adsr: { a: 0.6, d: 1.0, s: 0.6, r: 2.2 } }));
  p.delay({ tiempo: 0.34, realimentacion: 0.4, mezcla: 0.34 });
  p.curva([[0, 0.35], [2.2, 1.0], [4.4, 1.0], [5.85, 0]]);
  guardar("cama-final.wav", p);
}

console.log("El golpe del agente...");

// --- 4. El golpe: peso, definicion y un acorde que resuelve -------------
{
  const p = new Pista(2.9);

  // Transitorio: define el ataque, es lo que hace que se escuche "seco".
  p.poner(0, ruido({ dur: 0.05, corte: 14000, pasaAltos: 1200, gan: 0.5, caida: 90 }));

  // Sub que cae: el peso. Baja de 130 a 41 Hz (Do, dos octavas abajo).
  p.poner(0, barrido({ desde: 130, hasta: hz("E1"), dur: 2.2, curva: 3.4,
                       gan: 0.85, caida: 1.9 }));

  // Acorde de Do mayor: la tension de La menor por fin resuelve.
  acorde(p, { notas: ["C3", "E3", "G3", "C4"], dur: 2.3, gan: 0.17,
              corte: [5200, 900],
              adsr: { a: 0.006, d: 0.45, s: 0.4, r: 1.3 } });

  // Campana: el brillo dorado que queda sonando arriba.
  for (const [nota, g, d] of [["C5", 0.17, 2.5], ["G5", 0.11, 2.4], ["C6", 0.07, 2.2]]) {
    p.poner(0.004, voz({ nota, dur: d, forma: "seno", gan: g,
                         adsr: { a: 0.002, d: 1.4, s: 0.12, r: d * 0.45 } }));
  }

  // Aire: el soplido corto que acompana al impacto.
  p.poner(0, ruido({ dur: 0.55, corte: 9000, pasaAltos: 2200, gan: 0.3, caida: 11 }));

  p.delay({ tiempo: 0.19, realimentacion: 0.36, mezcla: 0.3 });
  p.curva([[0, 1], [2.3, 1], [2.88, 0]]);
  guardar("impacto-agente.wav", p);
}

console.log("\nListo.");
