import Link from "next/link";

import type { GrupoDeFiltro } from "./BarraFiltros";
import { OrdenDesplegable } from "./OrdenDesplegable";

import "../estilos.css";

export interface PropsBarraResultados {
  /** "8 productos". */
  resumen: string;
  /** Si hay filtros puestos: enlace para quitarlos todos. */
  hrefLimpiar?: string | null;
  /** Grupo de orden ("Ordenar"): sus opciones van a la derecha. */
  orden: GrupoDeFiltro | null;
}

/**
 * Parte los grupos de un listado: el de orden va a la barra de resultados y el
 * resto, al panel de filtros. Asi cada pagina no repite esta decision.
 */
export function separarOrden(grupos: GrupoDeFiltro[]): {
  orden: GrupoDeFiltro | null;
  filtros: GrupoDeFiltro[];
} {
  const orden = grupos.find((grupo) => grupo.titulo === "Ordenar") ?? null;
  return { orden, filtros: grupos.filter((grupo) => grupo !== orden) };
}

/**
 * Barra sobre el grid de productos: cuantos resultados hay y como se ordenan.
 * Solo enlaces, como el resto de los filtros: sin JavaScript.
 */
export function BarraResultados({ resumen, hrefLimpiar, orden }: PropsBarraResultados) {
  return (
    <div className="ui-barra-resultados">
      <p className="ui-barra-resultados__resumen">
        <span>{resumen}</span>
        {hrefLimpiar ? (
          <Link className="ui-barra-resultados__limpiar" href={hrefLimpiar} scroll={false}>
            Quitar filtros
          </Link>
        ) : null}
      </p>
      {orden && orden.opciones.length > 0 ? (
        <OrdenDesplegable titulo={orden.titulo} opciones={orden.opciones} />
      ) : null}
    </div>
  );
}
