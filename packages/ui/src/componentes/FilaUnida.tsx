import type { ReactNode } from "react";

import "./estilos/fila-unida.css";

export interface PropsFilaUnida {
  /** Reparte el ancho a partes iguales en vez de angosto + resto. */
  iguales?: boolean;
  children: ReactNode;
}

/**
 * Dos controles pegados en una sola fila, tambien en movil. Por defecto el
 * primero es angosto (un selector de tipo) y el segundo ocupa el resto (su
 * numero), el mismo patron del prefijo telefonico de `Campo`. Con `iguales`
 * los dos miden lo mismo (nombre y apellido).
 */
export function FilaUnida({ iguales, children }: PropsFilaUnida) {
  return <div className={iguales ? "ui-fila-unida ui-fila-unida--iguales" : "ui-fila-unida"}>{children}</div>;
}
