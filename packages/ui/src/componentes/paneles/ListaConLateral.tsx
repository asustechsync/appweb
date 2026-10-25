import type { ReactNode } from "react";

import "./lista-con-lateral.css";

export interface PropsListaConLateral {
  /** La lista, a la izquierda. */
  children: ReactNode;
  /** Filtros y buscador: ocupan todo el ancho, encima de la lista y del bloque. */
  barra?: ReactNode;
  /** El bloque de al lado: una `VistaPrevia`. Solo se ve en escritorio. */
  lateral: ReactNode;
}

/**
 * Lista con un bloque fijo a su derecha. El bloque se queda a la vista al
 * bajar por la lista. Bajo el escritorio desaparece: ahi la lista ocupa todo.
 */
export function ListaConLateral({ children, lateral, barra }: PropsListaConLateral) {
  return (
    <div className="ui-lista-con-lateral-conjunto">
      {barra}
      <div className="ui-lista-con-lateral">
        <div className="ui-lista-con-lateral__lista">{children}</div>
        <aside className="ui-lista-con-lateral__lateral">{lateral}</aside>
      </div>
    </div>
  );
}
