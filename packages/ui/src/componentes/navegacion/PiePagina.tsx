import Link from "next/link";

import { IconoLibro } from "../../iconos";
import { Contenedor } from "../base/Contenedor";

import "./pie-pagina.css";

export interface EnlaceDePie {
  etiqueta: string;
  href: string;
}

export interface GrupoDePie {
  titulo: string;
  enlaces: EnlaceDePie[];
}

export interface PropsPiePagina {
  grupos: GrupoDePie[];
  /** Ruta del Libro de Reclamaciones: la norma pide el aviso visible en la portada. */
  hrefLibro: string;
  /** Linea final: razon social y RUC de quien vende. */
  leyenda: string;
}

/**
 * Pie de la tienda: enlaces de ayuda y legales, el aviso del Libro de
 * Reclamaciones y quien vende. Base movil en una columna; desde md, grupos en
 * fila con el libro a la derecha.
 */
export function PiePagina({ grupos, hrefLibro, leyenda }: PropsPiePagina) {
  return (
    <footer className="ui-pie-pagina">
      <Contenedor>
        <div className="ui-pie-pagina__cuerpo">
          {grupos.map((grupo) => (
            <nav key={grupo.titulo} className="ui-pie-pagina__grupo" aria-label={grupo.titulo}>
              <h2 className="ui-pie-pagina__titulo">{grupo.titulo}</h2>
              <ul>
                {grupo.enlaces.map((enlace) => (
                  <li key={enlace.href}>
                    <Link href={enlace.href}>{enlace.etiqueta}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <Link className="ui-pie-pagina__libro" href={hrefLibro}>
            <IconoLibro tamano={28} />
            <span>Libro de Reclamaciones</span>
          </Link>
        </div>
        <p className="ui-pie-pagina__leyenda">{leyenda}</p>
      </Contenedor>
    </footer>
  );
}
