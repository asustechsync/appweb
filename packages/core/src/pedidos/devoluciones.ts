/**
 * Devoluciones, cambios y reembolsos de un pedido.
 *
 * No hay tabla propia: todo lo que una devolucion deja ya tiene donde vivir.
 *   · Las prendas que vuelven  -> MovimientoStock DEVOLUCION del pedido.
 *   · La prenda que sale en un cambio -> MovimientoStock VENTA del pedido.
 *   · La plata que se devuelve -> un Pago REEMBOLSADO con su numero de operacion.
 *   · Quien, cuando y por que  -> una linea de HistorialPedido que no cambia
 *     el estado (ENTREGADO -> ENTREGADO, CANCELADO -> CANCELADO).
 * Las cuatro se escriben en la misma transaccion, asi que comparten fecha y
 * se leen juntas como una sola devolucion.
 *
 * Solo dos situaciones admiten devolucion:
 *   · ENTREGADO: el cliente devuelve o cambia prendas; puede haber reembolso.
 *   · CANCELADO: el stock ya volvio al cancelar; solo falta devolver la plata
 *     de un pago que se habia confirmado.
 */

import { MONEDA } from "../formato";
import type { MovimientoNuevo } from "../stock/movimientos";
import type { EstadoPedido } from "./estados";
import { ETIQUETAS_MEDIO_PAGO, type MedioPagoPedido } from "./gestion";

/** Estados donde se registra una devolucion: el historial la marca sin moverlo. */
export const ESTADOS_CON_DEVOLUCION: readonly EstadoPedido[] = ["ENTREGADO", "CANCELADO"];

export function esDevolucion(anterior: EstadoPedido | null, nuevo: EstadoPedido): boolean {
  return anterior === nuevo && ESTADOS_CON_DEVOLUCION.includes(nuevo);
}

export interface LineaDevolucion {
  varianteId: string;
  /** Unidades de esta variante en el pedido. */
  vendidas: number;
  /** Las que ya volvieron en devoluciones anteriores. */
  yaDevueltas: number;
  /** Las que vuelven ahora. */
  aDevolver: number;
  /** Cambio: la variante que se le envia a cambio, por las mismas unidades. */
  reemplazo?: { varianteId: string; mismoProducto: boolean; stock: number };
}

export interface EntradaDevolucion {
  estadoPedido: EstadoPedido;
  medio: MedioPagoPedido;
  lineas: LineaDevolucion[];
  /** Monto a devolver. 0 = sin reembolso. */
  reembolso: number;
  /** Lo confirmado menos lo ya reembolsado: el tope de un reembolso. */
  reembolsable: number;
  referencia: string | null;
  motivo: string;
}

export type RechazoDevolucion =
  | "pedido_no_devolvible"
  | "cancelado_sin_unidades"
  | "nada_que_registrar"
  | "excede_lo_vendido"
  | "reemplazo_igual"
  | "reemplazo_otro_producto"
  | "reemplazo_sin_stock"
  | "reembolso_excede"
  | "falta_referencia"
  | "falta_motivo";

const MENSAJES: Record<RechazoDevolucion, string> = {
  pedido_no_devolvible: "Solo se registran devoluciones de pedidos entregados o cancelados.",
  cancelado_sin_unidades:
    "El stock de un pedido cancelado ya volvió al almacén: solo se registra el reembolso.",
  nada_que_registrar: "Elige qué prendas vuelven o escribe el monto a reembolsar.",
  excede_lo_vendido: "No se pueden devolver más unidades de las que quedan en el pedido.",
  reemplazo_igual: "El cambio tiene que ser por otra talla o color.",
  reemplazo_otro_producto: "Un cambio es por el mismo producto en otra talla o color.",
  reemplazo_sin_stock: "No hay stock de la talla o color por la que se quiere cambiar.",
  reembolso_excede: "El reembolso supera lo que el cliente pagó y no se le ha devuelto.",
  falta_referencia: "Escribe el número de operación del reembolso.",
  falta_motivo: "Escribe el motivo de la devolución.",
};

export function mensajeDeRechazoDevolucion(motivo: RechazoDevolucion): string {
  return MENSAJES[motivo];
}

export function revisarDevolucion(entrada: EntradaDevolucion): RechazoDevolucion | null {
  if (!ESTADOS_CON_DEVOLUCION.includes(entrada.estadoPedido)) return "pedido_no_devolvible";

  const unidades = entrada.lineas.reduce((suma, l) => suma + l.aDevolver, 0);
  if (entrada.estadoPedido === "CANCELADO" && unidades > 0) return "cancelado_sin_unidades";
  if (unidades === 0 && entrada.reembolso <= 0) return "nada_que_registrar";

  for (const linea of entrada.lineas) {
    if (linea.aDevolver < 0 || linea.aDevolver > linea.vendidas - linea.yaDevueltas) {
      return "excede_lo_vendido";
    }
    const r = linea.reemplazo;
    if (r === undefined || linea.aDevolver === 0) continue;
    if (r.varianteId === linea.varianteId) return "reemplazo_igual";
    if (!r.mismoProducto) return "reemplazo_otro_producto";
  }

  // Varias lineas pueden cambiarse por la misma variante: se suma antes de comparar.
  const pedidas = new Map<string, { cantidad: number; stock: number }>();
  for (const linea of entrada.lineas) {
    if (linea.reemplazo === undefined || linea.aDevolver === 0) continue;
    const previa = pedidas.get(linea.reemplazo.varianteId);
    pedidas.set(linea.reemplazo.varianteId, {
      cantidad: (previa?.cantidad ?? 0) + linea.aDevolver,
      stock: linea.reemplazo.stock,
    });
  }
  for (const { cantidad, stock } of pedidas.values()) {
    if (cantidad > stock) return "reemplazo_sin_stock";
  }

  if (entrada.reembolso < 0 || entrada.reembolso > entrada.reembolsable + 0.005) {
    return "reembolso_excede";
  }
  if (
    entrada.reembolso > 0 &&
    entrada.medio !== "CONTRA_ENTREGA" &&
    (entrada.referencia ?? "").trim() === ""
  ) {
    return "falta_referencia";
  }
  if (entrada.motivo.trim() === "") return "falta_motivo";
  return null;
}

/** Lo que vuelve al almacen y lo que sale por los cambios. */
export function movimientosDeDevolucion(
  lineas: LineaDevolucion[],
  pedidoId: string,
  motivo: string,
): MovimientoNuevo[] {
  const nota = motivo.trim();
  const movimientos: MovimientoNuevo[] = [];
  for (const linea of lineas) {
    if (linea.aDevolver === 0) continue;
    const cambio = linea.reemplazo !== undefined;
    movimientos.push({
      varianteId: linea.varianteId,
      delta: linea.aDevolver,
      motivo: "DEVOLUCION",
      pedidoId,
      nota: `${cambio ? "Cambio" : "Devolución"}: ${nota}`,
    });
    if (linea.reemplazo) {
      movimientos.push({
        varianteId: linea.reemplazo.varianteId,
        delta: -linea.aDevolver,
        motivo: "VENTA",
        pedidoId,
        nota: `Cambio: ${nota}`,
      });
    }
  }
  return movimientos;
}

export type TipoDevolucion = "DEVOLUCION" | "CAMBIO" | "REEMBOLSO";

export const ETIQUETAS_DEVOLUCION: Record<TipoDevolucion, string> = {
  DEVOLUCION: "Devolución",
  CAMBIO: "Cambio",
  REEMBOLSO: "Reembolso",
};

/** Como se llama lo registrado: un cambio pesa mas que una devolucion. */
export function tipoDeDevolucion(lineas: LineaDevolucion[]): TipoDevolucion {
  const activas = lineas.filter((l) => l.aDevolver > 0);
  if (activas.length === 0) return "REEMBOLSO";
  if (activas.some((l) => l.reemplazo !== undefined)) return "CAMBIO";
  return "DEVOLUCION";
}

/** Texto del historial: lo que se lee despues para saber que paso. */
export function notaDeDevolucion(detalle: {
  devueltas: number;
  cambiadas: number;
  reembolso: number;
  medio: MedioPagoPedido;
  referencia: string | null;
  motivo: string;
}): string {
  const partes: string[] = [];
  const devueltas = detalle.devueltas - detalle.cambiadas;
  if (devueltas > 0) partes.push(`Devolución de ${devueltas} u.`);
  if (detalle.cambiadas > 0) partes.push(`Cambio de ${detalle.cambiadas} u.`);
  if (detalle.reembolso > 0) {
    const referencia = detalle.referencia?.trim();
    partes.push(
      `Reembolso de ${MONEDA.format(detalle.reembolso)} por ${ETIQUETAS_MEDIO_PAGO[detalle.medio]}` +
        (referencia ? ` (op. ${referencia})` : ""),
    );
  }
  partes.push(`Motivo: ${detalle.motivo.trim()}`);
  return partes.join(". ");
}
