/**
 * Rechazar un pago desde el panel: el comprobante no corresponde, el monto no
 * llego o el numero de operacion es de otra compra.
 *
 * El pedido NO se cancela: sigue esperando un pago. El intento rechazado queda
 * en la tabla con su motivo y nace otro pendiente por el mismo monto, para que
 * el cliente vuelva a pagar y el panel lo confirme como siempre.
 */

import type { EstadoPedido } from "./estados";
import { ETIQUETAS_MEDIO_PAGO, type EstadoPago, type MedioPagoPedido } from "./gestion";

export type RechazoPago =
  | "contra_entrega_no_se_rechaza"
  | "pedido_no_pendiente"
  | "pago_ya_resuelto"
  | "falta_motivo";

const MENSAJES: Record<RechazoPago, string> = {
  contra_entrega_no_se_rechaza:
    "Contra entrega se cobra al entregar: si el cliente no paga, cancela el pedido.",
  pedido_no_pendiente: "Este pedido ya no está esperando un pago.",
  pago_ya_resuelto: "Ese pago ya fue confirmado o rechazado.",
  falta_motivo: "Escribe por qué se rechaza el pago: el cliente lo va a preguntar.",
};

export function mensajeDeRechazoPago(motivo: RechazoPago): string {
  return MENSAJES[motivo];
}

export interface EntradaRechazoPago {
  estadoPedido: EstadoPedido;
  estadoPago: EstadoPago;
  medio: MedioPagoPedido;
  motivo: string;
}

export function revisarRechazoPago(entrada: EntradaRechazoPago): RechazoPago | null {
  if (entrada.medio === "CONTRA_ENTREGA") return "contra_entrega_no_se_rechaza";
  if (entrada.estadoPedido !== "PENDIENTE_PAGO") return "pedido_no_pendiente";
  if (entrada.estadoPago !== "PENDIENTE") return "pago_ya_resuelto";
  if (entrada.motivo.trim() === "") return "falta_motivo";
  return null;
}

/** Texto del historial del pedido al rechazar un pago. */
export function notaDeRechazoPago(medio: MedioPagoPedido, motivo: string): string {
  return `Pago por ${ETIQUETAS_MEDIO_PAGO[medio]} rechazado: ${motivo.trim()}. Se espera un nuevo pago`;
}
