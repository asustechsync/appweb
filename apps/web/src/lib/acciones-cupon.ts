"use server";

import { mensajeDeRechazoCupon, revisarCupon, type Cupon } from "@appweb/core";

import { buscarReglaCupon } from "./cupones";

export type ResultadoCupon = { ok: true; cupon: Cupon } | { ok: false; error: string };

/**
 * ¿Vale este codigo para un carrito con este subtotal? La usa el carrito al
 * aplicar el cupon y al cambiar las cantidades (el minimo de compra depende
 * del subtotal). El checkout lo vuelve a revisar al cerrar: esto es solo para
 * mostrar el descuento antes.
 */
export async function consultarCupon(codigo: string, subtotal: number): Promise<ResultadoCupon> {
  const regla = await buscarReglaCupon(codigo);
  const revision = revisarCupon(regla, { subtotal });
  if ("rechazo" in revision) {
    return { ok: false, error: mensajeDeRechazoCupon(revision.rechazo, regla) };
  }
  return { ok: true, cupon: revision.cupon };
}
