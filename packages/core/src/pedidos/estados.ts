/**
 * Estados del pedido y que transiciones son validas.
 *
 * Vive aqui y no en el panel para que ni la web, ni el admin, ni la app movil
 * puedan dejar un pedido en un estado imposible.
 */

export type EstadoPedido =
  | "PENDIENTE_PAGO"
  | "PAGADO"
  | "PREPARANDO"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

const TRANSICIONES: Record<EstadoPedido, readonly EstadoPedido[]> = {
  PENDIENTE_PAGO: ["PAGADO", "CANCELADO"],
  PAGADO: ["PREPARANDO", "CANCELADO"],
  PREPARANDO: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["ENTREGADO"],
  // Finales: no se sale de aqui.
  ENTREGADO: [],
  CANCELADO: [],
};

export const ETIQUETAS: Record<EstadoPedido, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  PREPARANDO: "Preparando",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export function puedePasarA(desde: EstadoPedido, hacia: EstadoPedido): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

export function siguientesEstados(desde: EstadoPedido): readonly EstadoPedido[] {
  return TRANSICIONES[desde];
}

export function esFinal(estado: EstadoPedido): boolean {
  return TRANSICIONES[estado].length === 0;
}

/** El stock se descuenta al pagar y se devuelve al cancelar despues de pagar. */
export function afectaStock(
  desde: EstadoPedido,
  hacia: EstadoPedido,
): "descontar" | "devolver" | null {
  if (desde === "PENDIENTE_PAGO" && hacia === "PAGADO") return "descontar";
  if (hacia === "CANCELADO" && desde !== "PENDIENTE_PAGO") return "devolver";
  return null;
}
