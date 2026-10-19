import Link from "next/link";

import { FiltroRango, type PropsFiltroRango } from "./FiltroRango";

import "../estilos.css";

export interface OpcionDeFiltro {
  etiqueta: string;
  href: string;
  activa: boolean;
}

/** Barra deslizable de un grupo (precio): lo que necesita FiltroRango, menos el titulo. */
export type RangoDeFiltro = Omit<PropsFiltroRango, "titulo">;

export interface GrupoDeFiltro {
  titulo: string;
  /** Opciones como enlaces. Un grupo con `rango` puede no tener ninguna. */
  opciones: OpcionDeFiltro[];
  /** Si viene, el grupo se pinta como barra deslizable en vez de opciones. */
  rango?: RangoDeFiltro;
}

export interface PropsBarraFiltros {
  /** Solo los filtros; el orden va en BarraResultados. */
  grupos: GrupoDeFiltro[];
}

/**
 * Filtros de un listado como enlaces: cada opcion es la URL con ese filtro ya
 * puesto (o quitado, si estaba activo), y cada combinacion se cachea. El
 * rango (precio) es la unica isla cliente: una barra que navega al soltarla.
 * Cada grupo es un `details` abierto por defecto: en escritorio se puede
 * plegar sin JavaScript; en movil queda siempre abierto en la practica,
 * porque su titulo no muestra la flecha.
 */
export function BarraFiltros({ grupos }: PropsBarraFiltros) {
  return (
    <div className="ui-barra-filtros">
      {grupos
        .filter((grupo) => grupo.opciones.length > 0 || grupo.rango)
        .map((grupo) => (
          <details key={grupo.titulo} className="ui-barra-filtros__grupo" open>
            <summary className="ui-barra-filtros__titulo">{grupo.titulo}</summary>
            {grupo.rango ? (
              <div className="ui-barra-filtros__rango">
                <FiltroRango
                  key={`${grupo.rango.valorMin}-${grupo.rango.valorMax}`}
                  titulo={grupo.titulo}
                  {...grupo.rango}
                />
              </div>
            ) : (
              <ul className="ui-barra-filtros__opciones" aria-label={grupo.titulo}>
                {grupo.opciones.map((opcion) => (
                  <li key={opcion.href}>
                    <Link
                      className="ui-barra-filtros__opcion"
                      href={opcion.href}
                      aria-current={opcion.activa ? "true" : undefined}
                      scroll={false}
                    >
                      {opcion.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
    </div>
  );
}
