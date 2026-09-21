"use client";

import { agregarAlCarrito } from "@appweb/core";
import { FichaProducto, type PropsFichaProducto } from "@appweb/ui";

import { guardarCarrito, leerCarrito } from "@/lib/carrito-local";

type PropsFichaProductoCliente = Omit<PropsFichaProducto, "onAgregar" | "agregando">;

/**
 * Envoltorio cliente de `FichaProducto`: es quien sabe que el carrito vive en
 * localStorage. `FichaProducto` sigue siendo un componente de servidor cuando
 * se usa desde aqui adentro no importa — al venir de un archivo "use client",
 * toda esta rama se hidrata igual.
 */
export function FichaProductoCliente(props: PropsFichaProductoCliente) {
  function agregar(varianteId: string) {
    guardarCarrito(agregarAlCarrito(leerCarrito(), varianteId, 1));
  }

  return <FichaProducto {...props} onAgregar={agregar} />;
}
