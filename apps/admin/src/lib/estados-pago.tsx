import type { ReactNode } from "react";

import type { EstadoPago } from "@appweb/core";
import { IconoDevolucion, IconoFlechaBajada, IconoFlechaSubida, IconoReloj } from "@appweb/ui";

/** Palabras propias de la lista de pagos recientes; el resto usa `ETIQUETAS_PAGO`. */
export const ETIQUETA_PAGO_RECIENTE: Partial<Record<EstadoPago, string>> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Recibido",
};

/** Verde lo cobrado, ambar lo que falta confirmar, rojo lo que se cayo. */
export const ESTADO_PAGO: Record<
  EstadoPago,
  { tono: "exito" | "alerta" | "error" | "neutro"; icono: ReactNode }
> = {
  // Flecha arriba: entro plata. Flecha abajo: el cobro se cayo.
  CONFIRMADO: { tono: "exito", icono: <IconoFlechaSubida tamano={12} /> },
  PENDIENTE: { tono: "alerta", icono: <IconoReloj tamano={12} /> },
  RECHAZADO: { tono: "error", icono: <IconoFlechaBajada tamano={12} /> },
  REEMBOLSADO: { tono: "neutro", icono: <IconoDevolucion tamano={12} /> },
};
