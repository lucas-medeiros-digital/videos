import React from "react";
import { AbsoluteFill, interpolate, random, Easing } from "remotion";
import { MARCA } from "../guion";

/**
 * Temblor de camara determinista: el mismo frame da siempre el mismo
 * desplazamiento, asi el render es reproducible.
 */
export const sacudida = (frame: number, intensidad: number) => {
  if (intensidad <= 0) {
    return { x: 0, y: 0, giro: 0 };
  }
  return {
    x: (random(`sx${frame}`) - 0.5) * 2 * intensidad,
    y: (random(`sy${frame}`) - 0.5) * 2 * intensidad,
    giro: (random(`sr${frame}`) - 0.5) * 0.12 * intensidad,
  };
};

type PropsConFrame = { frame: number };

/** Destello que tapa la pantalla en el golpe y se va enseguida. */
export const Destello: React.FC<PropsConFrame & { desde: number }> = ({
  frame,
  desde,
}) => {
  const t = frame - desde;
  if (t < 0 || t > 12) {
    return null;
  }
  const opacidad = interpolate(t, [0, 1, 12], [0.18, 0.62, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 29%, ${MARCA.blanco} 0%, ${MARCA.doradoClaro} 35%, rgba(201,162,39,0) 70%)`,
        opacity: opacidad,
        mixBlendMode: "screen",
      }}
    />
  );
};

/** Anillo que se expande desde donde aparece el cartel del agente. */
export const OndaExpansiva: React.FC<
  PropsConFrame & { desde: number; x: number; y: number; duracion?: number }
> = ({ frame, desde, x, y, duracion = 30 }) => {
  const t = frame - desde;
  if (t < 0 || t > duracion) {
    return null;
  }
  const avance = t / duracion;
  const radio = interpolate(avance, [0, 1], [40, 1500], {
    easing: Easing.out(Easing.cubic),
  });
  const opacidad = interpolate(avance, [0, 0.15, 1], [0, 0.7, 0]);
  const grosor = interpolate(avance, [0, 1], [10, 1]);

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      <div
        style={{
          position: "absolute",
          left: x - radio,
          top: y - radio,
          width: radio * 2,
          height: radio * 2,
          borderRadius: "50%",
          border: `${grosor}px solid ${MARCA.doradoClaro}`,
          opacity: opacidad,
          boxShadow: `0 0 ${grosor * 6}px ${MARCA.dorado}`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Halo dorado que queda latiendo detras del cartel del agente. */
export const Resplandor: React.FC<
  PropsConFrame & {
    desde: number;
    hasta: number;
    x: number;
    y: number;
    fuerza?: number;
  }
> = ({ frame, desde, hasta, x, y, fuerza = 0.55 }) => {
  if (frame < desde || frame > hasta) {
    return null;
  }
  const t = frame - desde;
  const total = hasta - desde;
  const envolvente = interpolate(
    t,
    [0, 6, total * 0.5, total],
    [0, 1, 0.55, 0],
    { extrapolateRight: "clamp" },
  );
  const latido = 0.85 + 0.15 * Math.sin(t / 4);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 620px 320px at ${x}px ${y}px, rgba(232,199,106,${fuerza}) 0%, rgba(201,162,39,0.18) 45%, rgba(0,0,0,0) 72%)`,
        opacity: envolvente * latido,
        mixBlendMode: "screen",
      }}
    />
  );
};

/** Banda de luz que cruza la pantalla en diagonal, como un barrido. */
export const BarridoLuz: React.FC<
  PropsConFrame & { desde: number; duracion?: number }
> = ({ frame, desde, duracion = 26 }) => {
  const t = frame - desde;
  if (t < 0 || t > duracion) {
    return null;
  }
  const avance = t / duracion;
  const posicion = interpolate(avance, [0, 1], [-60, 160], {
    easing: Easing.inOut(Easing.quad),
  });
  const opacidad = interpolate(avance, [0, 0.25, 0.75, 1], [0, 0.4, 0.4, 0]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "screen" }}>
      <div
        style={{
          position: "absolute",
          inset: "-30%",
          background: `linear-gradient(104deg, rgba(0,0,0,0) ${posicion - 14}%, rgba(232,199,106,0.55) ${posicion}%, rgba(255,255,255,0.35) ${posicion + 4}%, rgba(0,0,0,0) ${posicion + 18}%)`,
          opacity: opacidad,
        }}
      />
    </AbsoluteFill>
  );
};

/** Vineta que se va cerrando mientras se acumulan los mensajes. */
export const Vineta: React.FC<{ fuerza: number }> = ({ fuerza }) => {
  if (fuerza <= 0) {
    return null;
  }
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 72% 58% at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,${0.72 * fuerza}) 100%)`,
      }}
    />
  );
};

/** Brillo breve y suave, para el tilde verde y el boton del cierre. */
export const Chispa: React.FC<
  PropsConFrame & {
    desde: number;
    x: number;
    y: number;
    color?: string;
    radio?: number;
    duracion?: number;
  }
> = ({
  frame,
  desde,
  x,
  y,
  color = MARCA.doradoClaro,
  radio = 260,
  duracion = 20,
}) => {
  const t = frame - desde;
  if (t < 0 || t > duracion) {
    return null;
  }
  const opacidad = interpolate(t, [0, 3, duracion], [0, 0.65, 0], {
    easing: Easing.out(Easing.quad),
  });
  const escala = interpolate(t, [0, duracion], [0.6, 1.5]);

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      <div
        style={{
          position: "absolute",
          left: x - radio,
          top: y - radio,
          width: radio * 2,
          height: radio * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 65%)`,
          opacity: opacidad,
          transform: `scale(${escala})`,
        }}
      />
    </AbsoluteFill>
  );
};
