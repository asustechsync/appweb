import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsRejillaProductos {
  children: ReactNode;
}

/**
 * Grid responsive de tarjetas de producto. Generico a proposito: sirve para
 * ofertas, destacados o el listado de una categoria — quien la usa decide
 * que productos entran.
 */
export function RejillaProductos({ children }: PropsRejillaProductos) {
  return <div className="ui-rejilla-productos">{children}</div>;
}
