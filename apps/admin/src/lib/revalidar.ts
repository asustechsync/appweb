"use client";

/** Producto cuya ficha y listados cambian (stock, precio, datos). */
export interface ProductoTocado {
  slug: string;
  slugCategoria: string;
}

/**
 * Pide a la tienda que regenere las paginas de estos productos. `catalogo`
 * cuando cambia QUE productos existen (alta, baja, cambio de slug).
 *
 * El dato ya quedo guardado: si esto falla, la tienda solo tarda en mostrar
 * el cambio (el checkout siempre relee precio y stock de la base). Por eso
 * devuelve `false` en vez de lanzar.
 */
export async function revalidarCatalogo(
  productos: ProductoTocado[],
  catalogo = false,
): Promise<boolean> {
  if (productos.length === 0 && !catalogo) return true;
  try {
    const respuesta = await fetch("/api/revalidar-catalogo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productos, catalogo }),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}

/** Las tarifas de envio cambiaron: el checkout las tiene en cache. */
export async function revalidarEnvios(): Promise<boolean> {
  try {
    const respuesta = await fetch("/api/revalidar-catalogo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productos: [], envios: true }),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}

/** Cambiaron los banners: la portada los tiene en cache. */
export async function revalidarPortada(): Promise<boolean> {
  try {
    const respuesta = await fetch("/api/revalidar-catalogo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productos: [], portada: true }),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}
