/**
 * Stock: siempre por movimiento, nunca por UPDATE.
 *
 * `Variante.stock` es solo un cache del saldo para no sumar el historico en
 * cada lectura del catalogo. La verdad es la suma de los movimientos, y por
 * eso siempre se puede responder POR QUE falta mercaderia.
 */

export type MotivoStock = "INGRESO" | "VENTA" | "DEVOLUCION" | "AJUSTE" | "MERMA";

export interface MovimientoNuevo {
  varianteId: string;
  /** Positivo suma, negativo resta. */
  delta: number;
  motivo: MotivoStock;
  pedidoId?: string;
  nota?: string;
}

export interface LineaVendida {
  varianteId: string;
  cantidad: number;
}

/** Movimientos que genera un pedido al pagarse. */
export function movimientosPorVenta(
  lineas: LineaVendida[],
  pedidoId: string,
): MovimientoNuevo[] {
  return lineas.map((linea) => ({
    varianteId: linea.varianteId,
    delta: -Math.abs(linea.cantidad),
    motivo: "VENTA" as const,
    pedidoId,
  }));
}

/** Movimientos que genera una cancelacion o devolucion. */
export function movimientosPorDevolucion(
  lineas: LineaVendida[],
  pedidoId: string,
  nota?: string,
): MovimientoNuevo[] {
  return lineas.map((linea) => ({
    varianteId: linea.varianteId,
    delta: Math.abs(linea.cantidad),
    motivo: "DEVOLUCION" as const,
    pedidoId,
    ...(nota ? { nota } : {}),
  }));
}

/** Ajuste manual desde el panel. Exige nota: sin motivo escrito no hay ajuste. */
export function movimientoPorAjuste(
  varianteId: string,
  stockContado: number,
  stockEnSistema: number,
  nota: string,
): MovimientoNuevo | null {
  const delta = stockContado - stockEnSistema;
  if (delta === 0) return null;
  return { varianteId, delta, motivo: "AJUSTE", nota };
}

export function saldoDe(movimientos: Array<{ delta: number }>): number {
  return movimientos.reduce((suma, m) => suma + m.delta, 0);
}

export function hayStock(disponible: number, pedido: number): boolean {
  return pedido > 0 && pedido <= disponible;
}
