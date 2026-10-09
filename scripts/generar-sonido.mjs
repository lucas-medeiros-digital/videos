/**
 * Diseño de sonido del reel. Sin musica: solo efectos.
 *
 *   node scripts/generar-sonido.mjs
 *
 * La idea es un lanzamiento de producto, no un anuncio: minimo, preciso,
 * con aire alrededor de cada sonido. Nada tiene que sonar a "efecto de
 * ciencia ficcion"; todo tiene que sonar a una pieza de software bien
 * hecha respondiendo.
 *
 * Tres reglas que ordenan toda la paleta:
 *   - Las campanas son FM con relacion no entera: eso da el timbre
 *     cristalino, metalico sin ser estridente.
 *   - Todo lleva reverb de placa. Un sonido seco suena barato.
 *   - La tension se construye con ritmo y capas, nunca subiendo el
 *     volumen.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import {
  Pista, campana, glissando, moldear, ruido, voz, barrido, hz,
} from "./sintetizador.mjs";

const DESTINO = "public/audio";
mkdirSync(DESTINO, { recursive: true });

const guardar = (nombre, pista) => {
  writeFileSync(`${DESTINO}/${nombre}`, pista.limitar(0.86).aWav());
  console.log(`  ${nombre.padEnd(22)} ${(pista.n / 48000).toFixed(2)}s`);
};

console.log("Mensajes que llegan...");

/**
 * Notificacion: un toque corto y limpio, nunca un "pop".
 *
 * Son tres variantes que suben de tono apenas. Repetir el mismo archivo
 * veinte veces suena a maquina; alternar tres hace que la acumulacion se
 * sienta viva sin que ninguna llame la atencion.
 */
["C6", "D6", "E6"].forEach((nota, i) => {
  const p = new Pista(0.9);
  p.poner(0, campana({ nota, dur: 0.75, relacion: 1.41, indice: 2.6,
                       caida: 9, caidaIndice: 26, gan: 0.34 }),
          { pan: i === 0 ? -0.18 : i === 1 ? 0.1 : -0.04 });
  // Un cuerpo grave muy corto: le da peso sin ensuciar.
  p.poner(0, voz({ nota: "C4", dur: 0.12, forma: "seno", gan: 0.09,
                   adsr: { a: 0.002, d: 0.05, s: 0.1, r: 0.06 } }));
  p.reverb({ tiempo: 1.1, mezcla: 0.2 });
  guardar(`notificacion-${i + 1}.wav`, p);
});

console.log("La aparicion del agente...");

/** Barrido digital: entra limpio y termina justo donde empieza el golpe. */
{
  const p = new Pista(1.0);
  const aire = moldear(
    ruido({ dur: 0.9, corte: 7000, pasaAltos: 900, gan: 0.34, caida: 0 }),
    [[0, 0], [0.75, 0.85], [1, 0]],
  );
  p.poner(0, aire, { pan: -0.3 });
  p.poner(0.02, aire, { pan: 0.3 });
  p.poner(0, moldear(
    glissando({ desde: 320, hasta: 2400, dur: 0.9, gan: 0.16, curva: 2.4 }),
    [[0, 0], [0.8, 1], [1, 0]],
  ));
  p.reverb({ tiempo: 1.4, mezcla: 0.22 });
  guardar("barrido.wav", p);
}

/**
 * La firma del agente. Cuatro capas, cada una con un trabajo:
 *   chasquido  -> define el instante exacto
 *   sub        -> peso, pero contenido: no es una explosion
 *   campanas   -> la inteligencia, el timbre cristalino
 *   cola       -> el aire que deja un producto caro
 */
{
  const p = new Pista(3.2);

  p.poner(0, ruido({ dur: 0.03, corte: 16000, pasaAltos: 3500, gan: 0.42, caida: 220 }));
  p.poner(0, barrido({ desde: 78, hasta: 44, dur: 1.8, curva: 2.6, gan: 0.52, caida: 3.2 }));

  // Quinta justa: dos notas que no pelean, suena resuelto de entrada.
  p.poner(0.004, campana({ nota: "C5", dur: 3.0, relacion: 2.76, indice: 4.2,
                           caida: 1.9, caidaIndice: 6, gan: 0.3 }), { pan: -0.22 });
  p.poner(0.012, campana({ nota: "G5", dur: 2.8, relacion: 3.47, indice: 3.4,
                           caida: 2.3, caidaIndice: 8, gan: 0.19 }), { pan: 0.26 });
  p.poner(0.03, campana({ nota: "C6", dur: 2.4, relacion: 2.01, indice: 2.2,
                          caida: 3.1, caidaIndice: 11, gan: 0.11 }));

  p.poner(0, moldear(ruido({ dur: 0.4, corte: 11000, pasaAltos: 2600, gan: 0.18, caida: 0 }),
                     [[0, 1], [1, 0]]));
  p.reverb({ tiempo: 2.6, mezcla: 0.3 });
  guardar("activacion.wav", p);
}

console.log("El agente trabajando...");

/** Clic de interfaz: corto, preciso, casi tactil. */
{
  const p = new Pista(0.4);
  p.poner(0, ruido({ dur: 0.02, corte: 13000, pasaAltos: 4200, gan: 0.3, caida: 300 }));
  p.poner(0, campana({ nota: "G6", dur: 0.3, relacion: 1.73, indice: 1.4,
                       caida: 22, caidaIndice: 50, gan: 0.2 }));
  p.reverb({ tiempo: 0.8, mezcla: 0.16 });
  guardar("clic.wav", p);
}

/** Confirmacion: dos notas que suben, muy al fondo. */
{
  const p = new Pista(0.8);
  p.poner(0, campana({ nota: "E6", dur: 0.4, relacion: 2.01, indice: 1.6,
                       caida: 13, caidaIndice: 30, gan: 0.18 }), { pan: -0.2 });
  p.poner(0.055, campana({ nota: "B6", dur: 0.5, relacion: 2.01, indice: 1.3,
                           caida: 11, caidaIndice: 28, gan: 0.13 }), { pan: 0.2 });
  p.reverb({ tiempo: 1.2, mezcla: 0.24 });
  guardar("confirmacion.wav", p);
}

/**
 * Textura de fondo: no es musica, es aire con un centro tonal muy debil.
 * Sostiene el tramo de automatizacion para que no quede hueco entre un
 * clic y el siguiente.
 */
{
  const p = new Pista(7.0);
  p.poner(0, moldear(ruido({ dur: 7, corte: 2600, pasaAltos: 320, gan: 0.085, caida: 0 }),
                     [[0, 0], [0.12, 1], [0.8, 0.9], [1, 0]]), { pan: -0.4 });
  p.poner(0.5, moldear(ruido({ dur: 6.5, corte: 3400, pasaAltos: 420, gan: 0.07, caida: 0 }),
                       [[0, 0], [0.15, 1], [0.8, 0.85], [1, 0]]), { pan: 0.4 });
  p.poner(0, moldear(voz({ nota: "C3", dur: 7, forma: "seno", gan: 0.05,
                           adsr: { a: 1.4, d: 1, s: 0.8, r: 2 } }),
                     [[0, 0], [0.25, 1], [0.75, 0.8], [1, 0]]));
  p.reverb({ tiempo: 3.2, mezcla: 0.34 });
  guardar("textura.wav", p);
}

console.log("Cero consultas y cierre...");

/** Cero consultas: cristalino arriba, calido abajo. Contenido. */
{
  const p = new Pista(2.8);
  for (const [nota, g, d, pan] of [
    ["E6", 0.26, 2.4, -0.2], ["G6", 0.18, 2.2, 0.22], ["C7", 0.1, 1.9, 0],
  ]) {
    p.poner(0, campana({ nota, dur: d, relacion: 2.01, indice: 2.4,
                         caida: 2.6, caidaIndice: 9, gan: g }), { pan });
  }
  // El grave calido: no se escucha como nota, se siente como respaldo.
  p.poner(0, voz({ nota: "C3", dur: 1.6, forma: "seno", gan: 0.22,
                   adsr: { a: 0.008, d: 0.5, s: 0.3, r: 0.8 } }));
  p.reverb({ tiempo: 2.4, mezcla: 0.3 });
  guardar("logro.wav", p);
}

/**
 * Cierre de marca: una subida tonal y una nota final que resuelve.
 * Lo importante es el aire que queda despues; por eso la pista dura mas
 * que el sonido.
 */
{
  const p = new Pista(4.2);
  p.poner(0, moldear(
    glissando({ desde: 180, hasta: 262, dur: 1.5, gan: 0.14, curva: 0.6, forma: "doble" }),
    [[0, 0], [0.7, 1], [1, 0.3]],
  ));
  p.poner(0, moldear(ruido({ dur: 1.5, corte: 4200, pasaAltos: 700, gan: 0.1, caida: 0 }),
                     [[0, 0], [0.8, 1], [1, 0]]), { pan: 0.25 });

  // La nota final llega despues de la subida, no encima.
  p.poner(1.35, campana({ nota: "C5", dur: 2.6, relacion: 2.76, indice: 3,
                          caida: 1.7, caidaIndice: 7, gan: 0.28 }), { pan: -0.15 });
  p.poner(1.37, campana({ nota: "G5", dur: 2.4, relacion: 2.01, indice: 2,
                          caida: 2.1, caidaIndice: 9, gan: 0.15 }), { pan: 0.2 });
  p.poner(1.35, voz({ nota: "C3", dur: 2.2, forma: "seno", gan: 0.17,
                      adsr: { a: 0.01, d: 0.7, s: 0.25, r: 1.2 } }));
  p.reverb({ tiempo: 3.0, mezcla: 0.32 });
  guardar("marca.wav", p);
}

console.log("\nListo.");
