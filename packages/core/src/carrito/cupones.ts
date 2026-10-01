/**
 * Cupones de descuento.
 *
 * Por ahora son una lista fija, sin tabla: alcanza para probar el carrito y el
 * checkout. Cuando haya campañas reales se moveran a la base, y esta funcion
 * seguira siendo la unica que decide cuanto descuenta un codigo.
 */

export interface Cupon {
  codigo: string;
  /** Porcentaje del subtotal, de 1 a 100. */
  porcentaje: number;
}

const CUPONES: Cupon[] = [{ codigo: "PROMO10", porcentaje: 10 }];

/** Busca un cupon sin distinguir mayusculas ni espacios. `null` si no existe. */
export function buscarCupon(codigo: string | null | undefined): Cupon | null {
  const limpio = (codigo ?? "").trim().toUpperCase();
  return CUPONES.find((cupon) => cupon.codigo === limpio) ?? null;
}

/** Cuanto descuenta el cupon sobre un subtotal. 0 si no hay cupon. */
export function descuentoDeCupon(subtotal: number, cupon: Cupon | null): number {
  if (!cupon) return 0;
  return Math.round(((subtotal * cupon.porcentaje) / 100 + Number.EPSILON) * 100) / 100;
}
