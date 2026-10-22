/**
 * Compras a proveedor y costo de la mercaderia.
 *
 * El costo nace en la compra: cada linea dice cuantas unidades entraron y a
 * cuanto. De ahi sale el INGRESO de stock (regla 5) y el costo que la variante
 * guarda como cache. Al vender, el costo se congela en ItemPedido igual que el
 * precio (regla 7): el margen de una venta pasada no cambia si mañana se
 * compra mas caro.
 */

import type { MovimientoNuevo } from "../stock/movimientos";

export interface LineaCompra {
  varianteId: string;
  cantidad: number;
  costoUnitario: number;
}

export type RechazoCompra =
  | "proveedor_inactivo"
  | "sin_lineas"
  | "cantidad_invalida"
  | "costo_invalido"
  | "variante_repetida";

const MENSAJES: Record<RechazoCompra, string> = {
  proveedor_inactivo: "Ese proveedor está desactivado. Actívalo antes de registrar la compra.",
  sin_lineas: "Agrega al menos una prenda a la compra.",
  cantidad_invalida: "Cada línea necesita una cantidad entera mayor que cero.",
  costo_invalido: "El costo unitario no puede ser negativo.",
  variante_repetida: "Hay una talla y color repetidos: júntalos en una sola línea.",
};

export function mensajeDeRechazoCompra(motivo: RechazoCompra): string {
  return MENSAJES[motivo];
}

export function revisarCompra(entrada: {
  proveedorActivo: boolean;
  lineas: LineaCompra[];
}): RechazoCompra | null {
  if (!entrada.proveedorActivo) return "proveedor_inactivo";
  if (entrada.lineas.length === 0) return "sin_lineas";
  const vistas = new Set<string>();
  for (const linea of entrada.lineas) {
    if (!Number.isInteger(linea.cantidad) || linea.cantidad <= 0) return "cantidad_invalida";
    if (!Number.isFinite(linea.costoUnitario) || linea.costoUnitario < 0) return "costo_invalido";
    if (vistas.has(linea.varianteId)) return "variante_repetida";
    vistas.add(linea.varianteId);
  }
  return null;
}

/** Redondeo a centimos: los montos se guardan con dos decimales. */
export function aCentimos(monto: number): number {
  return Math.round(monto * 100) / 100;
}

export function totalDeCompra(lineas: LineaCompra[]): number {
  return aCentimos(lineas.reduce((suma, l) => suma + l.cantidad * l.costoUnitario, 0));
}

/** Un INGRESO por linea, con la referencia de la compra en la nota. */
export function movimientosDeCompra(
  lineas: LineaCompra[],
  compraId: string,
  nota: string,
): MovimientoNuevo[] {
  return lineas.map((linea) => ({
    varianteId: linea.varianteId,
    delta: linea.cantidad,
    motivo: "INGRESO" as const,
    compraId,
    nota,
  }));
}

export function notaDeCompra(proveedor: string, documento: string | null): string {
  const doc = documento?.trim();
  return `Compra a ${proveedor.trim()}${doc ? ` (${doc})` : ""}`;
}

export interface Margen {
  /** Ganancia por unidad. */
  monto: number;
  /** Sobre el precio de venta, de 0 a 100. */
  porcentaje: number;
}

/** Margen bruto de vender a `precio` lo que costo `costo`. `null` sin costo. */
export function margenDe(precio: number, costo: number | null): Margen | null {
  if (costo === null || precio <= 0) return null;
  const monto = aCentimos(precio - costo);
  return { monto, porcentaje: Math.round((monto / precio) * 1000) / 10 };
}
