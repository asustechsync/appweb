"use client";

/** Producto cuya ficha y listados cambian (stock, precio, datos, fotos). */
export interface ProductoTocado {
  slug: string;
  slugCategoria: string;
}

/** Que paginas de la tienda dejaron de estar al dia. */
export interface CambiosEnTienda {
  productos?: ProductoTocado[];
  /** Cambio QUE productos existen (alta, baja, cambio de slug). */
  catalogo?: boolean;
  /** Tarifas de envio: el checkout las tiene en cache. */
  envios?: boolean;
  /** Banners de la portada. */
  portada?: boolean;
}

/**
 * Pide a la tienda que regenere lo que cambio. Unico camino del panel a la
 * cache de la tienda (las etiquetas viven en apps/web/src/lib/cache.ts).
 *
 * El dato ya quedo guardado: si esto falla, la tienda solo tarda en mostrar
 * el cambio (el checkout siempre relee precio y stock de la base). Por eso
 * devuelve `false` en vez de lanzar.
 */
export async function revalidarTienda(cambios: CambiosEnTienda): Promise<boolean> {
  const { productos = [], catalogo = false, envios = false, portada = false } = cambios;
  if (productos.length === 0 && !catalogo && !envios && !portada) return true;
  try {
    const respuesta = await fetch("/api/revalidar-catalogo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productos, catalogo, envios, portada }),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}
