import type { ReactNode } from "react";

import { IconoExportar } from "../../iconos";

import "./panel-con-pestanas.css";

export interface PropsPanelConPestanas {
  /** El selector de pestañas; ocupa todo el ancho de la barra. */
  pestanas: ReactNode;
  /** Interruptor junto a las pestañas (Visible en la tienda). */
  interruptor?: ReactNode;
  /** Menú de acciones secundarias, tras el botón de abrir en la tienda. */
  menu?: ReactNode;
  /** Botón cuadrado a la derecha de las pestañas (abrir en la tienda). Sin él, no hay botón. */
  accion?: { href: string; etiqueta: string };
  /** Botones de la pagina (volver, guardar), en la misma linea que las pestañas. */
  acciones?: ReactNode;
  /** Columna fija a la derecha del contenido: vista previa, estado. */
  lateral?: ReactNode;
  /** El contenido de las pestañas; cada seccion, un hijo directo. */
  children: ReactNode;
}

/**
 * Una sola tarjeta con las pestañas arriba y, debajo, el contenido en bloques
 * grises (las tarjetas de dentro se tiñen de gris). El lateral queda fijo a la
 * derecha desde pantalla ancha; en movil baja debajo del contenido.
 */
export function PanelConPestanas({
  pestanas,
  interruptor,
  menu,
  accion,
  acciones,
  lateral,
  children,
}: PropsPanelConPestanas) {
  return (
    <section className="ui-panel-pestanas">
      <div className="ui-panel-pestanas__barra">
        <div className="ui-panel-pestanas__selector">{pestanas}</div>
        {interruptor}
        {accion ? (
          <a
            className="ui-panel-pestanas__accion"
            href={accion.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={accion.etiqueta}
            title={accion.etiqueta}
          >
            <IconoExportar tamano={20} />
          </a>
        ) : null}
        {menu}
        {acciones ? <div className="ui-panel-pestanas__acciones">{acciones}</div> : null}
      </div>
      <div
        className={
          lateral
            ? "ui-panel-pestanas__cuerpo ui-panel-pestanas__cuerpo--lateral"
            : "ui-panel-pestanas__cuerpo"
        }
      >
        {children}
        {lateral ? <aside className="ui-panel-pestanas__lateral">{lateral}</aside> : null}
      </div>
    </section>
  );
}
