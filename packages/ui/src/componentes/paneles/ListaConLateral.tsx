import type { CSSProperties, ReactNode } from "react";

import "./lista-con-lateral.css";

export interface PropsListaConLateral {
  /** La lista, a la izquierda. */
  children: ReactNode;
  /** Filtros y buscador: ocupan todo el ancho, encima de la lista y del bloque. */
  barra?: ReactNode;
  /** El bloque de al lado: una `VistaPrevia`. Solo se ve en escritorio. */
  lateral: ReactNode;
  /**
   * Cuantas filas caben en una pagina completa. Con esto, la lista conserva el
   * alto de ese tamano aunque haya menos resultados (o ninguno): el bloque no
   * se encoge ni salta al filtrar. Solo en escritorio.
   */
  filasPorPagina?: number;
}

/**
 * Lista con un bloque fijo a su derecha. El bloque se queda a la vista al
 * bajar por la lista. Bajo el escritorio desaparece: ahi la lista ocupa todo.
 */
export function ListaConLateral({
  children,
  lateral,
  barra,
  filasPorPagina,
}: PropsListaConLateral) {
  return (
    <div className="ui-lista-con-lateral-conjunto">
      {barra}
      <div
        className={
          filasPorPagina
            ? "ui-lista-con-lateral ui-lista-con-lateral--alto-fijo"
            : "ui-lista-con-lateral"
        }
        {...(filasPorPagina
          ? { style: { "--ui-filas-pagina": filasPorPagina } as CSSProperties }
          : {})}
      >
        <div className="ui-lista-con-lateral__lista">{children}</div>
        <aside className="ui-lista-con-lateral__lateral">{lateral}</aside>
      </div>
    </div>
  );
}
