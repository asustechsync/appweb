import type { ReactNode } from "react";

import "../estilos.css";

export interface PropsDisposicionListado {
  /** Filtros del listado (BarraFiltros). En escritorio van en la columna lateral. */
  filtros: ReactNode;
  /** Barra sobre los productos (BarraResultados): conteo y orden. */
  barra?: ReactNode;
  children: ReactNode;
}

/**
 * Listado con filtros: en movil, los filtros arriba y los productos debajo;
 * desde escritorio, una columna lateral con los filtros y, a su derecha, la
 * barra de resultados sobre los productos. Lo usan las pantallas que tienen
 * filtros: categorias y busqueda.
 */
export function DisposicionListado({ filtros, barra, children }: PropsDisposicionListado) {
  return (
    <div className="ui-disposicion-listado">
      <aside className="ui-disposicion-listado__filtros">{filtros}</aside>
      <div className="ui-disposicion-listado__resultados">
        {barra}
        {children}
      </div>
    </div>
  );
}
