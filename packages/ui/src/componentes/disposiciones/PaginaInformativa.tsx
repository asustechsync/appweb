import type { ReactNode } from "react";

import { Contenedor } from "../base/Contenedor";

import "../estilos.css";

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

/**
 * Tabla dentro de una pagina informativa (guia de tallas). En movil se
 * desplaza en horizontal dentro de su recuadro, sin mover la pagina.
 */
export function TablaInformativa({ children }: { children: ReactNode }) {
  return (
    <div className="ui-pagina-informativa__tabla-envoltorio">
      <table>{children}</table>
    </div>
  );
}

export interface PropsEnlaceDestacado {
  href: string;
  children: ReactNode;
  /** Abre en otra pestaña (WhatsApp, sitios externos). */
  externo?: boolean;
}

/** Llamado a la accion de una pagina informativa: "Escribir por WhatsApp". */
export function EnlaceDestacado({ href, children, externo = false }: PropsEnlaceDestacado) {
  return (
    <a
      className="ui-pagina-informativa__cta"
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
