import type { ReactNode } from "react";

import "./barra-lista.css";

export interface PropsBarraLista {
  /** Las pestañas o filtros, a la izquierda. */
  children: ReactNode;
  /** El buscador, a la derecha desde tablet. */
  buscador?: ReactNode;
  /** Filtros pegados al buscador, ambos a la derecha, en vez de en extremos opuestos. */
  juntos?: boolean;
  /** Usa el fondo de los controles en el buscador, en lugar del fondo de cápsula. */
  fondoBuscador?: "capsula" | "control";
}

/**
 * Cabecera de un listado del panel: filtros y buscador en una sola linea.
 * En movil el buscador baja debajo de los filtros.
 */
export function BarraLista({
  children,
  buscador,
  juntos = false,
  fondoBuscador = "capsula",
}: PropsBarraLista) {
  return (
    <div className={juntos ? "ui-barra-lista ui-barra-lista--juntos" : "ui-barra-lista"}>
      <div className="ui-barra-lista__filtros">{children}</div>
      {buscador ? (
        <div
          className={
            fondoBuscador === "control"
              ? "ui-barra-lista__buscador ui-barra-lista__buscador--control"
              : "ui-barra-lista__buscador"
          }
        >
          {buscador}
        </div>
      ) : null}
    </div>
  );
}
