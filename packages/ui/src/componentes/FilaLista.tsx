import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsFilaLista {
  children: ReactNode;
  /** Controles de la fila. En movil bajan debajo del contenido. */
  acciones?: ReactNode;
}

/**
 * Una fila de un listado del panel.
 *
 * No es una tabla a proposito: FIRST MOBILE. Una tabla de seis columnas no
 * cabe en un telefono y obliga a desplazar en horizontal; esto se apila.
 */
export function FilaLista({ children, acciones }: PropsFilaLista) {
  return (
    <article className="ui-fila-lista">
      <div className="ui-fila-lista__contenido">{children}</div>
      {acciones ? <div className="ui-fila-lista__acciones">{acciones}</div> : null}
    </article>
  );
}
