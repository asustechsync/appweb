import { CALIFICACION, FECHA } from "@appweb/core/formato";

import { Estrellas } from "./Estrellas";

import "../estilos.css";

export interface ResenaPublicada {
  id: string;
  autor: string;
  estrellas: number;
  comentario: string | null;
  /** ISO 8601. */
  fecha: string;
}

export interface PropsListaResenas {
  /** Ya resumida por `resumenCalificacion` de @appweb/core. `null` sin reseñas. */
  calificacion: { promedio: number; total: number } | null;
  resenas: ResenaPublicada[];
}

/**
 * Opiniones de la ficha: la nota media arriba y las reseñas publicadas
 * debajo, la mas nueva primero. Componente de servidor, sin estado.
 */
export function ListaResenas({ calificacion, resenas }: PropsListaResenas) {
  return (
    <section className="ui-resenas" aria-labelledby="titulo-resenas">
      <h2 id="titulo-resenas" className="ui-resenas__titulo">
        Opiniones
      </h2>

      {calificacion ? (
        <div className="ui-resenas__resumen">
          <span className="ui-resenas__nota">{CALIFICACION.format(calificacion.promedio)}</span>
          <span className="ui-resenas__resumen-detalle">
            <Estrellas valor={calificacion.promedio} tamano={18} />
            <span className="ui-resenas__total">
              {calificacion.total} {calificacion.total === 1 ? "opinión" : "opiniones"} de clientes
              que lo compraron
            </span>
          </span>
        </div>
      ) : (
        <p className="ui-resenas__vacio">
          Todavía no hay opiniones. Las escriben quienes ya recibieron este producto.
        </p>
      )}

      {resenas.length > 0 ? (
        <ul className="ui-resenas__lista">
          {resenas.map((resena) => (
            <li key={resena.id} className="ui-resenas__item">
              <div className="ui-resenas__cabecera">
                <Estrellas valor={resena.estrellas} tamano={14} />
                <span className="ui-resenas__autor">{resena.autor}</span>
                <time className="ui-resenas__fecha" dateTime={resena.fecha}>
                  {FECHA.format(new Date(resena.fecha))}
                </time>
              </div>
              {resena.comentario ? (
                <p className="ui-resenas__comentario">{resena.comentario}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
