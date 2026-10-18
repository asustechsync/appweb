/**
 * Movimientos de stock que registra una persona desde el panel: entra
 * mercaderia, se cuenta el almacen o algo se daña.
 *
 * Cada uno deja un MovimientoStock con su motivo. Por eso el ajuste y la merma
 * exigen nota: dentro de tres meses alguien va a preguntar por que faltan
 * cinco boxers, y la respuesta tiene que estar escrita.
 */

import { movimientoPorAjuste, type MovimientoNuevo } from "./movimientos";

export const TIPOS_MOVIMIENTO_MANUAL = ["INGRESO", "AJUSTE", "MERMA"] as const;
export type TipoMovimientoManual = (typeof TIPOS_MOVIMIENTO_MANUAL)[number];

export const ETIQUETAS_MOVIMIENTO: Record<
  "INGRESO" | "VENTA" | "DEVOLUCION" | "AJUSTE" | "MERMA",
  string
> = {
  INGRESO: "Ingreso",
  VENTA: "Venta",
  DEVOLUCION: "Devolución",
  AJUSTE: "Ajuste por conteo",
  MERMA: "Merma",
};

export type RechazoStock =
  | "cantidad_invalida"
  | "falta_nota"
  | "merma_mayor_que_stock"
  | "ajuste_sin_cambio";

const MENSAJES: Record<RechazoStock, string> = {
  cantidad_invalida: "Escribe una cantidad entera mayor que cero.",
  falta_nota: "Escribe el motivo: queda en el historial del stock.",
  merma_mayor_que_stock: "No puedes dar de baja más unidades de las que hay.",
  ajuste_sin_cambio: "El conteo coincide con el sistema: no hay nada que ajustar.",
};

export function mensajeDeRechazoStock(motivo: RechazoStock): string {
  return MENSAJES[motivo];
}

export interface EntradaMovimientoManual {
  tipo: TipoMovimientoManual;
  varianteId: string;
  /** INGRESO y MERMA: unidades que entran o salen. AJUSTE: lo que se conto. */
  cantidad: number;
  stockActual: number;
  nota?: string | null;
}

/** El movimiento a escribir, o por que no se puede. */
export function planMovimientoManual(
  entrada: EntradaMovimientoManual,
): { movimiento: MovimientoNuevo } | { rechazo: RechazoStock } {
  const { tipo, varianteId, cantidad, stockActual } = entrada;
  const nota = entrada.nota?.trim() ?? "";

  if (!Number.isInteger(cantidad) || cantidad < 0) return { rechazo: "cantidad_invalida" };

  if (tipo === "INGRESO") {
    if (cantidad === 0) return { rechazo: "cantidad_invalida" };
    return {
      movimiento: { varianteId, delta: cantidad, motivo: "INGRESO", ...(nota ? { nota } : {}) },
    };
  }

  if (nota === "") return { rechazo: "falta_nota" };

  if (tipo === "MERMA") {
    if (cantidad === 0) return { rechazo: "cantidad_invalida" };
    if (cantidad > stockActual) return { rechazo: "merma_mayor_que_stock" };
    return { movimiento: { varianteId, delta: -cantidad, motivo: "MERMA", nota } };
  }

  const ajuste = movimientoPorAjuste(varianteId, cantidad, stockActual, nota);
  return ajuste ? { movimiento: ajuste } : { rechazo: "ajuste_sin_cambio" };
}
