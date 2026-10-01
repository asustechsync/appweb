import type { ReactNode } from "react";

import "./primitivos.css";

/** Bloque que agrupa la cabecera y las lineas del carrito, con el mismo
    fondo y radio que ResumenCompra. */
export function BloqueLineas({ children }: { children: ReactNode }) {
  return <section className="ui-bloque-lineas" aria-label="Productos">{children}</section>;
}
