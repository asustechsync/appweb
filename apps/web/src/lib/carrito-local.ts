/**
 * El carrito en el navegador.
 *
 * Solo el guardado vive aqui: como se modifica una linea es logica de negocio
 * y esta en `@appweb/core/carrito/guardado`, que la app movil usa igual contra
 * AsyncStorage. Esto es unicamente el puente con localStorage.
 *
 * No hay tabla Carrito en la base a proposito: un carrito anonimo no necesita
 * fila propia, y el pedido ya congela sus lineas al cerrarse.
 */

import { normalizarCarrito, type LineaGuardada } from "@appweb/core";

export const CARRITO_LLAVE = "appweb:carrito";

/** Avisa a las demas islas de la pestaña (el icono de la cabecera, por ejemplo)
    que el carrito cambio. `storage` solo dispara en OTRAS pestañas. */
export const CARRITO_EVENTO = "appweb:carrito-cambio";

export function leerCarrito(): LineaGuardada[] {
  try {
    const guardado = localStorage.getItem(CARRITO_LLAVE);
    if (guardado === null) return [];
    return normalizarCarrito(JSON.parse(guardado));
  } catch {
    // Almacenamiento bloqueado o JSON corrupto: se arranca con carrito vacio
    // en vez de romper la pantalla.
    return [];
  }
}

export function guardarCarrito(lineas: LineaGuardada[]): void {
  try {
    localStorage.setItem(CARRITO_LLAVE, JSON.stringify(lineas));
    window.dispatchEvent(new CustomEvent(CARRITO_EVENTO));
  } catch {
    /* almacenamiento no disponible: el carrito dura lo que dure la pestaña */
  }
}
