"use client";

import { BotonCarrito } from "@appweb/ui";

import { useCantidadCarrito } from "@/lib/use-cantidad-carrito";

/**
 * Isla cliente de la cabecera: `BotonCarrito` con el contador de unidades. La
 * cabecera sigue siendo estatica; solo esta isla lee localStorage.
 */
export function BotonCarritoCabecera() {
  return <BotonCarrito cantidad={useCantidadCarrito()} />;
}
