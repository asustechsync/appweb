import type { ReactNode } from "react";

import { Contenedor } from "./Contenedor";

import "./primitivos.css";

export interface PropsPaginaInformativa {
  titulo: string;
  children: ReactNode;
}

/**
 * Layout compartido por las paginas de contenido estatico (Guia de Tallas,
 * Envios, Ayuda, Mayorista...): un titulo y texto en columna angosta, sin
 * datos de la base. Cada pagina solo aporta el contenido, nunca el estilo.
 */
export function PaginaInformativa({ titulo, children }: PropsPaginaInformativa) {
  return (
    <Contenedor>
      <article className="ui-pagina-informativa">
        <h1>{titulo}</h1>
        {children}
      </article>
    </Contenedor>
  );
}
