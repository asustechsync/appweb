/**
 * Gestion de pedidos desde el panel: confirmar un pago y mover un pedido de
 * estado.
 *
 * Aqui se decide QUE esta permitido y QUE movimientos de stock genera cada
 * cambio. La ruta del panel solo lee de la base, pregunta aqui y escribe lo
 * que estas funciones devuelven, en una transaccion. Asi la app movil, o una
 * futura pasarela que confirme pagos sola, rechazan y descuentan exactamente
 * lo mismo.
 */

import {
  movimientosPorDevolucion,
  movimientosPorVenta,
  type LineaVendida,
  type MovimientoNuevo,
} from "../stock/movimientos";
import { afectaStock, ETIQUETAS, puedePasarA, type EstadoPedido } from "./estados";

/** TARJETA llega con la pasarela: hoy la base lo acepta, pero el checkout no lo ofrece. */
export const MEDIOS_PAGO = ["YAPE", "PLIN", "TRANSFERENCIA", "CONTRA_ENTREGA", "TARJETA"] as const;
export type MedioPagoPedido = (typeof MEDIOS_PAGO)[number];

/**
 * Los medios con los que la tienda cobra hoy. CONTRA_ENTREGA sigue en la base
 * por si algun pedido viejo lo tuviera, pero ya no se ofrece ni se reporta.
 */
export const MEDIOS_DE_COBRO: readonly MedioPagoPedido[] = [
  "YAPE",
  "PLIN",
  "TRANSFERENCIA",
  "TARJETA",
];

export const ETIQUETAS_MEDIO_PAGO: Record<MedioPagoPedido, string> = {
  YAPE: "Yape",
  PLIN: "Plin",
  TRANSFERENCIA: "Transferencia",
  CONTRA_ENTREGA: "Contra entrega",
  TARJETA: "Tarjeta",
};

/** Las marcas de tarjeta que se distinguen; cualquier otra cuenta como "otra". */
export type MarcaTarjeta = "visa" | "mastercard" | "otra";

/** Como se guarda y se muestra cada marca: "Visa", "Mastercard". */
export const ETIQUETAS_MARCA_TARJETA: Record<MarcaTarjeta, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  otra: "Tarjeta",
};

/**
 * La marca tal como la escriba la pasarela ("Visa", "VS", "MASTERCARD", "MC")
 * llevada a una de las conocidas. Sin marca, "otra".
 */
export function marcaDeTarjeta(texto: string | null | undefined): MarcaTarjeta {
  const marca = (texto ?? "").trim().toLowerCase();
  if (marca === "visa" || marca === "vs") return "visa";
  if (marca === "mastercard" || marca === "mc" || marca === "master") return "mastercard";
  return "otra";
}

export const ESTADOS_PAGO = [
  "PENDIENTE",
  "CONFIRMADO",
  "RECHAZADO",
  "REEMBOLSADO",
  "ANULADO",
] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const ETIQUETAS_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: "Por confirmar",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
  REEMBOLSADO: "Reembolsado",
  ANULADO: "Anulado",
};

export type RechazoPedido =
  | "pedido_no_pendiente"
  | "pago_ya_resuelto"
  | "falta_referencia"
  | "contra_entrega_sin_pago_previo"
  | "transicion_invalida"
  | "pagado_solo_confirmando"
  | "fuera_del_despacho"
  | "sin_stock";

const MENSAJES: Record<RechazoPedido, string> = {
  pedido_no_pendiente: "Este pedido ya no está esperando un pago.",
  pago_ya_resuelto: "Ese pago ya fue confirmado o rechazado.",
  falta_referencia: "Escribe el número de operación del pago.",
  contra_entrega_sin_pago_previo:
    "Contra entrega se cobra al entregar: confirma el pedido pasándolo a Preparando.",
  transicion_invalida: "Ese cambio de estado no está permitido.",
  pagado_solo_confirmando: "Para marcarlo pagado, confirma el pago con su número de operación.",
  fuera_del_despacho: "Desde envíos solo se prepara, se envía o se entrega un pedido.",
  sin_stock: "No hay stock suficiente para este pedido.",
};

export function mensajeDeRechazoPedido(motivo: RechazoPedido): string {
  return MENSAJES[motivo];
}

// ── Confirmar pago ──────────────────────────────────────────────────────────

export interface EntradaConfirmacionPago {
  estadoPedido: EstadoPedido;
  estadoPago: EstadoPago;
  medio: MedioPagoPedido;
  /** Numero de operacion de Yape, Plin o la transferencia. */
  referencia: string | null;
}

/**
 * Confirmar un pago lleva el pedido de PENDIENTE_PAGO a PAGADO y descuenta el
 * stock. Sin numero de operacion no hay confirmacion: es lo unico que
 * responde "¿de que transferencia salio esta plata?" si el cliente reclama.
 */
export function revisarConfirmacionPago(entrada: EntradaConfirmacionPago): RechazoPedido | null {
  if (entrada.medio === "CONTRA_ENTREGA") return "contra_entrega_sin_pago_previo";
  if (entrada.estadoPedido !== "PENDIENTE_PAGO") return "pedido_no_pendiente";
  if (entrada.estadoPago !== "PENDIENTE") return "pago_ya_resuelto";
  if ((entrada.referencia ?? "").trim() === "") return "falta_referencia";
  return null;
}

// ── Cambiar estado ──────────────────────────────────────────────────────────

export interface EntradaCambioEstado {
  desde: EstadoPedido;
  hacia: EstadoPedido;
  medio: MedioPagoPedido;
}

/**
 * Cualquier cambio manual de estado. PAGADO no se alcanza por aqui: solo
 * confirmando un pago, que es lo que deja registrado el numero de operacion.
 */
export function revisarCambioEstado(entrada: EntradaCambioEstado): RechazoPedido | null {
  if (entrada.hacia === "PAGADO") return "pagado_solo_confirmando";
  const contraEntrega = entrada.medio === "CONTRA_ENTREGA";
  if (!puedePasarA(entrada.desde, entrada.hacia, { contraEntrega })) return "transicion_invalida";
  return null;
}

/**
 * Los pasos que da el almacen. Preparar, enviar y entregar; nunca confirmar
 * un pago ni cancelar: eso es de quien vende. Asi el rol ALMACEN puede mover
 * la cola de despacho sin poder tocar la plata.
 */
const PASOS_DE_DESPACHO: ReadonlyArray<readonly [EstadoPedido, EstadoPedido]> = [
  ["PAGADO", "PREPARANDO"],
  ["PREPARANDO", "ENVIADO"],
  ["ENVIADO", "ENTREGADO"],
];

export function revisarDespacho(entrada: EntradaCambioEstado): RechazoPedido | null {
  const esPaso = PASOS_DE_DESPACHO.some(([d, h]) => d === entrada.desde && h === entrada.hacia);
  if (!esPaso) return "fuera_del_despacho";
  return revisarCambioEstado(entrada);
}

/** Estados que ve la cola de despacho, en el orden en que se trabajan. */
export const ESTADOS_DESPACHO: readonly EstadoPedido[] = ["PAGADO", "PREPARANDO", "ENVIADO"];

/** Dias en camino desde los que un envio cuenta como demorado. */
export const DIAS_DEMORA_ENVIO = 3;

const UN_DIA = 24 * 60 * 60 * 1000;

/** Un envio entregado al transportista hace `DIAS_DEMORA_ENVIO` dias o mas y aun sin entregar. */
export function estaDemorado(enviadoEn: Date, ahora: Date): boolean {
  return ahora.getTime() - enviadoEn.getTime() >= DIAS_DEMORA_ENVIO * UN_DIA;
}

/** Junta las lineas de una misma variante: el stock se compara por variante. */
function porVariante(lineas: LineaVendida[]): LineaVendida[] {
  const suma = new Map<string, number>();
  for (const linea of lineas) {
    suma.set(linea.varianteId, (suma.get(linea.varianteId) ?? 0) + linea.cantidad);
  }
  return [...suma].map(([varianteId, cantidad]) => ({ varianteId, cantidad }));
}

/** Movimientos de stock que deja un cambio de estado. Lista vacia si no toca stock. */
export function movimientosDelCambio(
  desde: EstadoPedido,
  hacia: EstadoPedido,
  lineas: LineaVendida[],
  pedidoId: string,
): MovimientoNuevo[] {
  const efecto = afectaStock(desde, hacia);
  if (efecto === "descontar") return movimientosPorVenta(porVariante(lineas), pedidoId);
  if (efecto === "devolver") {
    return movimientosPorDevolucion(porVariante(lineas), pedidoId, "Pedido cancelado");
  }
  return [];
}

/**
 * Variantes que no alcanzan para el pedido. Se revisa antes de descontar para
 * dar un mensaje claro; la restriccion `stock >= 0` de la base es la ultima
 * barrera si dos pedidos se confirman a la vez por la misma unidad.
 */
export function variantesSinStock(
  lineas: LineaVendida[],
  stockActual: ReadonlyMap<string, number>,
): string[] {
  return porVariante(lineas)
    .filter((linea) => (stockActual.get(linea.varianteId) ?? 0) < linea.cantidad)
    .map((linea) => linea.varianteId);
}

/** Texto del historial: lo que se lee despues para saber que paso. */
export function notaDeCambio(
  hacia: EstadoPedido,
  detalle: { medio?: MedioPagoPedido; referencia?: string | null; nota?: string | null } = {},
): string {
  const partes: string[] = [];
  if (hacia === "PAGADO" && detalle.medio) {
    partes.push(
      `Pago confirmado por ${ETIQUETAS_MEDIO_PAGO[detalle.medio]}` +
        (detalle.referencia ? ` (op. ${detalle.referencia.trim()})` : ""),
    );
  } else {
    partes.push(`Pasó a ${ETIQUETAS[hacia]}`);
  }
  const nota = detalle.nota?.trim();
  if (nota) partes.push(nota);
  return partes.join(". ");
}
