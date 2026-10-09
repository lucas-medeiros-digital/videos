import { Config } from "@remotion/cli/config";

// Calidad de video: CRF bajo = mejor calidad, archivo mas grande.
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setCrf(18);

// Mantiene los colores correctos al mezclar video del telefono con graficos.
Config.setChromiumOpenGlRenderer("angle");

// En tu computadora Remotion descarga su propio navegador y esto no hace falta.
// En entornos sin salida a internet (una sesion en la nube, un servidor de CI)
// podes apuntar a un Chromium ya instalado:
//   REMOTION_BROWSER=/ruta/al/chrome npm run render:intro
const navegador = process.env.REMOTION_BROWSER;
if (navegador) {
  Config.setBrowserExecutable(navegador);
}
