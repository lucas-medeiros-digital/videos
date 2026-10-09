/**
 * Arma el groove de percusion y el golpe del agente.
 *
 *   node scripts/generar-musica.mjs
 *
 * Antes del agente NO hay musica: solo los tics de los mensajes sobre el
 * silencio. El agobio se construye con el vacio, y asi la percusion que
 * entra despues se siente como un cambio de verdad.
 *
 * El groove va a 138 BPM y arranca en el frame 133. No es un tempo
 * cualquiera: con la negra en 0,435 s, los momentos del video caen sobre
 * tiempos fuertes.
 *
 *   frame 237 (cero consultas) -> tiempo 9,  arranque del compas 3
 *   frame 303 (titular)        -> tiempo 13, arranque del compas 4
 *   frame 393 (logo)           -> tiempo 20, ultimo tiempo del compas 5
 */

import { writeFileSync, mkdirSync } from "node:fs";
import {
  Pista, voz, ruido, barrido, hz,
  bombo, palma, shaker, conga, vocal,
} from "./sintetizador.mjs";

const DESTINO = "public/audio";
const BPM = 138;
const NEGRA = 60 / BPM;
const SEMI = NEGRA / 4;        // semicorchea
const DURACION = 11.2;         // del frame 133 al final del video

mkdirSync(DESTINO, { recursive: true });

const guardar = (nombre, pista) => {
  writeFileSync(`${DESTINO}/${nombre}`, pista.limitar().aWav());
  console.log(`  ${nombre.padEnd(22)} ${(pista.n / 48000).toFixed(2)}s`);
};

/** Convierte un numero de tiempo (empezando en 1) a segundos. */
const t = (tiempo) => (tiempo - 1) * NEGRA;

/**
 * Arma un groove.
 *
 * `intensidad(tiempo)` decide que suena en cada tiempo musical:
 *   1 shaker y sub · 2 + bombo · 3 + palmas · 4 + congas
 * Asi el mismo motor sirve para el reel corto y para los videos largos,
 * cambiando solo el plan de secciones.
 */
const construirGroove = ({ duracion, intensidad, ganchos = [], acentos = [] }) => {
  const p = new Pista(duracion);
  const TIEMPOS = Math.ceil(duracion / NEGRA);

  for (let n = 1; n <= TIEMPOS; n++) {
    const segundo = t(n);
    if (segundo >= duracion) break;
    const nivel = intensidad(n, segundo);
    if (nivel <= 0) continue;
    const pulso = ((n - 1) % 4) + 1;

    // Shaker: semicorcheas. Es lo que mantiene el movimiento.
    for (let s = 0; s < 4; s++) {
      p.poner(segundo + s * SEMI,
        shaker({ gan: s === 0 ? 0.26 : 0.15, dur: s === 0 ? 0.09 : 0.06 }),
        { pan: s % 2 ? 0.3 : -0.3 });
    }

    // Sub en el 1 y el 3.
    if (pulso === 1 || pulso === 3) {
      p.poner(segundo, voz({ nota: "C2", dur: NEGRA * 0.8, forma: "seno", gan: 0.34,
                             adsr: { a: 0.005, d: 0.2, s: 0.35, r: 0.15 } }));
    }

    if (nivel >= 2) {
      p.poner(segundo, bombo({ gan: nivel >= 3 ? 0.9 : 0.72 }));
    }
    if (nivel >= 3 && (pulso === 2 || pulso === 4)) {
      p.poner(segundo, palma({ gan: 0.42 }), { pan: 0.12 });
    }
    if (nivel >= 4) {
      p.poner(segundo + SEMI * 2, conga({ gan: 0.3, desde: 300, hasta: 170 }), { pan: -0.4 });
      if (pulso === 3) {
        p.poner(segundo + SEMI * 3, conga({ gan: 0.24, desde: 420, hasta: 240 }), { pan: 0.45 });
      }
    }
  }

  // Voces: el gancho que se canta encima.
  for (const [tiempo, nota, cual, dur] of ganchos) {
    const segundo = t(tiempo);
    if (segundo + dur > duracion) continue;
    p.poner(segundo, vocal({ nota, vocal: cual, dur, gan: 0.3 }), { pan: -0.1 });
    p.poner(segundo, vocal({ nota: hz(nota) * 1.5, vocal: cual, dur, gan: 0.14 }), { pan: 0.35 });
  }

  // Acentos: el barrido largo que marca un cambio de seccion.
  for (const tiempo of acentos) {
    p.poner(t(tiempo), shaker({ dur: 0.9, gan: 0.3, caida: 5.5, brillo: 9000 }));
  }

  p.delay({ tiempo: SEMI * 3, realimentacion: 0.22, mezcla: 0.2 });
  return p;
};

console.log("Groove de percusion...");

// --- Para el reel corto: entra con el agente y no para mas -------------
{
  const DURACION = 11.2;
  const CERO = 9, LOGO = 20;
  const p = construirGroove({
    duracion: DURACION,
    intensidad: (n) => {
      const enTitular = n >= 13 && n < LOGO;
      if (n < CERO) return 3;
      return enTitular ? 2 : 4;
    },
    ganchos: [
      [CERO, "C4", "a", 0.42], [CERO + 1.5, "E4", "o", 0.3],
      [CERO + 2, "G4", "a", 0.46], [CERO + 3.5, "E4", "o", 0.3],
      [LOGO, "C4", "a", 0.5], [LOGO + 1.5, "G4", "o", 0.34],
      [LOGO + 2, "C5", "a", 0.55], [LOGO + 3.5, "G4", "e", 0.36],
    ],
    acentos: [CERO, LOGO],
  });
  p.curva([[0, 0], [0.12, 0.55], [t(CERO), 1.0], [DURACION - 0.9, 1.0], [DURACION, 0]]);
  guardar("groove.wav", p);
}

// --- Para los dos videos largos: con secciones -------------------------
{
  const DURACION = 30;
  // Entra de a poco, levanta, respira en el medio y vuelve a subir.
  const intensidad = (_n, s) => {
    if (s < 3) return 1;
    if (s < 7) return 2;
    if (s < 11) return 3;
    if (s < 14) return 2;   // el bajon del medio deja lugar al giro
    if (s < 23) return 4;
    return 4;
  };
  const ganchos = [];
  for (const base of [33, 41, 55, 63]) {
    ganchos.push([base, "C4", "a", 0.42], [base + 1.5, "E4", "o", 0.3],
                 [base + 2, "G4", "a", 0.46], [base + 3.5, "E4", "o", 0.32]);
  }
  const p = construirGroove({
    duracion: DURACION,
    intensidad,
    ganchos,
    acentos: [8, 17, 33, 54],
  });
  p.curva([[0, 0], [0.4, 0.7], [3, 0.85], [14, 1.0], [DURACION - 2.2, 1.0], [DURACION, 0]]);
  guardar("groove-largo.wav", p);
}

console.log("El golpe del agente...");

{
  const p = new Pista(2.9);
  p.poner(0, ruido({ dur: 0.05, corte: 14000, pasaAltos: 1200, gan: 0.5, caida: 90 }));
  p.poner(0, barrido({ desde: 130, hasta: hz("E1"), dur: 2.2, curva: 3.4, gan: 0.85, caida: 1.9 }));

  // Acorde de Do mayor: la tension por fin resuelve.
  ["C3", "E3", "G3", "C4"].forEach((nota, i) => {
    p.poner(0, voz({ nota, dur: 2.3, forma: "sierra", gan: 0.17, corte: [5200, 900],
                     detune: (i - 2) * 5,
                     adsr: { a: 0.006, d: 0.45, s: 0.4, r: 1.3 } }),
            { pan: i / 3 - 0.5 });
  });

  for (const [nota, g, d] of [["C5", 0.17, 2.5], ["G5", 0.11, 2.4], ["C6", 0.07, 2.2]]) {
    p.poner(0.004, voz({ nota, dur: d, forma: "seno", gan: g,
                         adsr: { a: 0.002, d: 1.4, s: 0.12, r: d * 0.45 } }));
  }

  p.poner(0, ruido({ dur: 0.55, corte: 9000, pasaAltos: 2200, gan: 0.3, caida: 11 }));
  p.delay({ tiempo: 0.19, realimentacion: 0.36, mezcla: 0.3 });
  p.curva([[0, 1], [2.3, 1], [2.88, 0]]);
  guardar("impacto-agente.wav", p);
}

console.log("\nListo.");
