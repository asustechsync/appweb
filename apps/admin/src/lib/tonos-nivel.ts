import type { IdNivel } from "@appweb/core";
import type { TonoNivel } from "@appweb/ui";

/** El color de cada nivel en el panel: escalera, tarjetas y etiquetas. */
export const TONO_NIVEL: Record<IdNivel, TonoNivel> = {
  BASICO: "basico",
  BRONCE: "bronce",
  PLATA: "plata",
  ORO: "oro",
  PLATINO: "platino",
};
