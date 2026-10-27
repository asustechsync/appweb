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

/**
 * Lo que de verdad se vendio en un pedido: los productos menos el descuento.
 * El envio queda fuera: es plata que se va al courier, no venta de la tienda.
 */
export function vendidoDe(pedido: { subtotal: unknown; descuento: unknown }): number {
  return aCentimos(Number(pedido.subtotal) - Number(pedido.descuento));
}

/**
 * Que parte del precio de lista quedo tras el descuento del pedido, de 0 a 1:
 * con un cupon del 10 %, 0.9. Se aplica a cada linea para repartir el descuento.
 */
export function factorDeDescuento(subtotal: number, descuento: number): number {
  if (subtotal <= 0) return 1;
  return Math.max(0, Math.min(1, (subtotal - descuento) / subtotal));
}

/** Una linea vendida con su precio y su costo congelados en el pedido. */
export interface LineaConCosto {
  precioUnitario: number;
  costoUnitario: number | null;
  cantidad: number;
}

export interface MargenDeVentas {
  /** Lo vendido menos lo que costo, solo de las lineas con costo. */
  ganancia: number;
  /** Lo que costo lo vendido. */
  costo: number;
  /** Ganancia sobre lo vendido con costo, de 0 a 100. */
  porcentaje: number;
  /** Que parte de lo vendido tiene costo registrado, de 0 a 100: sin el 100, el margen es parcial. */
  cobertura: number;
}

/**
 * Margen bruto de un conjunto de ventas. Las lineas sin costo no entran en la
 * cuenta: suponer costo cero inflaria la ganancia. Cuanto pesan se ve en
 * `cobertura`.
 */
export function margenDeVentas(lineas: LineaConCosto[]): MargenDeVentas {
  let vendido = 0;
  let vendidoConCosto = 0;
  let costo = 0;
  for (const linea of lineas) {
    const venta = linea.precioUnitario * linea.cantidad;
    vendido += venta;
    if (linea.costoUnitario === null) continue;
    vendidoConCosto += venta;
    costo += linea.costoUnitario * linea.cantidad;
  }
  const ganancia = aCentimos(vendidoConCosto - costo);
  return {
    ganancia,
    costo: aCentimos(costo),
    porcentaje: vendidoConCosto > 0 ? Math.round((ganancia / vendidoConCosto) * 1000) / 10 : 0,
    cobertura: vendido > 0 ? Math.round((vendidoConCosto / vendido) * 100) : 0,
  };
}
