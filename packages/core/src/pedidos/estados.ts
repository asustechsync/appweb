/**
 * Estados del pedido y que transiciones son validas.
 *
 * Vive aqui y no en el panel para que ni la web, ni el admin, ni la app movil
 * puedan dejar un pedido en un estado imposible.
 */

export const ESTADOS_PEDIDO = [
  "PENDIENTE_PAGO",
  "PAGADO",
  "PREPARANDO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

const TRANSICIONES: Record<EstadoPedido, readonly EstadoPedido[]> = {
  PENDIENTE_PAGO: ["PAGADO", "CANCELADO"],
  PAGADO: ["PREPARANDO", "CANCELADO"],
  PREPARANDO: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["ENTREGADO"],
  // Finales: no se sale de aqui.
  ENTREGADO: [],
  CANCELADO: [],
};

/**
 * Contra entrega se cobra al final: el pedido no puede esperar un pago para
 * salir, porque el pago llega con el paquete. Se confirma directo a
 * PREPARANDO (ahi se descuenta el stock) y el cobro se registra al entregar.
 */
const TRANSICIONES_CONTRA_ENTREGA: Record<EstadoPedido, readonly EstadoPedido[]> = {
  ...TRANSICIONES,
  PENDIENTE_PAGO: ["PREPARANDO", "CANCELADO"],
};

export interface OpcionesEstado {
  /** El pedido se paga al recibirlo. */
  contraEntrega?: boolean;
}

function tabla(opciones: OpcionesEstado) {
  return opciones.contraEntrega ? TRANSICIONES_CONTRA_ENTREGA : TRANSICIONES;
}

export const ETIQUETAS: Record<EstadoPedido, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  PREPARANDO: "Preparando",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export function puedePasarA(
  desde: EstadoPedido,
  hacia: EstadoPedido,
  opciones: OpcionesEstado = {},
): boolean {
  return tabla(opciones)[desde].includes(hacia);
}

export function siguientesEstados(
  desde: EstadoPedido,
  opciones: OpcionesEstado = {},
): readonly EstadoPedido[] {
  return tabla(opciones)[desde];
}

export function esFinal(estado: EstadoPedido): boolean {
  return TRANSICIONES[estado].length === 0;
}

/**
 * El stock se descuenta cuando el pedido sale de "pendiente de pago" hacia
 * adelante (al pagar, o al confirmar uno contra entrega) y se devuelve al
 * cancelar uno que ya lo habia descontado.
 */
export function afectaStock(
  desde: EstadoPedido,
  hacia: EstadoPedido,
): "descontar" | "devolver" | null {
  if (desde === "PENDIENTE_PAGO" && (hacia === "PAGADO" || hacia === "PREPARANDO")) {
    return "descontar";
  }
  if (hacia === "CANCELADO" && desde !== "PENDIENTE_PAGO") return "devolver";
  return null;
}

export type SituacionPaso = "hecho" | "actual" | "pendiente";

export interface PasoPedido {
  estado: EstadoPedido;
  etiqueta: string;
  situacion: SituacionPaso;
}

/** El camino feliz de un pedido, en orden, con el texto que ve el cliente. */
const CAMINO: { estado: EstadoPedido; etiqueta: string }[] = [
  { estado: "PENDIENTE_PAGO", etiqueta: "Pedido recibido" },
  { estado: "PAGADO", etiqueta: "Pago confirmado" },
  { estado: "PREPARANDO", etiqueta: "Preparando" },
  { estado: "ENVIADO", etiqueta: "En camino" },
  { estado: "ENTREGADO", etiqueta: "Entregado" },
];

/**
 * Pasos para la linea de seguimiento: los ya cumplidos, el que se espera
 * ahora y los que faltan. Un pedido cancelado no tiene camino: lista vacia.
 */
export function pasosDelPedido(estado: EstadoPedido): PasoPedido[] {
  const indice = CAMINO.findIndex((paso) => paso.estado === estado);
  if (indice === -1) return [];

  return CAMINO.map((paso, i) => ({
    ...paso,
    situacion: i <= indice ? "hecho" : i === indice + 1 ? "actual" : "pendiente",
  }));
}
