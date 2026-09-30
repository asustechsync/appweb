import type { ReactNode } from "react";

import "./estilos/fila-opciones.css";

export interface PropsFilaOpciones {
  children: ReactNode;
}

/** Una casilla a la izquierda y un enlace a la derecha en la misma linea:
    "Recordarme" y "¿Olvidaste tu contraseña?". */
export function FilaOpciones({ children }: PropsFilaOpciones) {
  return <div className="ui-fila-opciones">{children}</div>;
}
