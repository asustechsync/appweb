import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsContenedor {
  children: ReactNode;
}

/** Limita el ancho de una seccion a --contenedor-ancho (1400px) y la centra. */
export function Contenedor({ children }: PropsContenedor) {
  return <div className="ui-contenedor">{children}</div>;
}
