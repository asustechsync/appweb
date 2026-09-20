import Link from "next/link";
import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsEstadoVacio {
  titulo: string;
  texto?: string;
  /** Nodo ya renderizado, para que sirva tanto en servidor como en cliente. */
  icono?: ReactNode;
  textoAccion?: string;
  hrefAccion?: string;
}

/**
 * Pantalla de "aqui no hay nada todavia": carrito vacio, busqueda sin
 * resultados, categoria sin productos.
 *
 * Siempre ofrece una salida — un carrito vacio sin un enlace de vuelta al
 * catalogo es un callejon sin salida.
 */
export function EstadoVacio({
  titulo,
  texto,
  icono,
  textoAccion,
  hrefAccion,
}: PropsEstadoVacio) {
  return (
    <div className="ui-estado-vacio">
      {icono ? <span className="ui-estado-vacio__icono">{icono}</span> : null}
      <h2 className="ui-estado-vacio__titulo">{titulo}</h2>
      {texto ? <p className="ui-estado-vacio__texto">{texto}</p> : null}
      {textoAccion && hrefAccion ? (
        <Link className="ui-estado-vacio__accion" href={hrefAccion}>
          {textoAccion}
        </Link>
      ) : null}
    </div>
  );
}
