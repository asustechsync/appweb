"use client";

import type { ReactNode } from "react";

import { AlternarTema } from "./AlternarTema";
import { Insignia } from "./Insignia";
import "./primitivos.css";

export interface SeccionDePanel {
  id: string;
  etiqueta: string;
}

export interface PropsDisposicionPanel {
  /** Ya filtradas por rol con `seccionesDelPanel` de @appweb/core. */
  secciones: SeccionDePanel[];
  seccionActiva: string;
  onSeccion: (id: string) => void;
  nombreUsuario: string;
  rolUsuario: string;
  onSalir?: () => void;
  hrefTienda?: string;
  children: ReactNode;
}

/**
 * Shell del panel: navegacion de secciones y area de contenido.
 *
 * No navega por su cuenta ni sabe que secciones existen — recibe la lista ya
 * filtrada por rol y avisa hacia arriba con `onSeccion`. Asi el cambio de
 * seccion es estado del cliente y no un viaje al servidor.
 */
export function DisposicionPanel({
  secciones,
  seccionActiva,
  onSeccion,
  nombreUsuario,
  rolUsuario,
  onSalir,
  hrefTienda,
  children,
}: PropsDisposicionPanel) {
  return (
    <div className="ui-disposicion-panel">
      <aside className="ui-disposicion-panel__lateral">
        <div className="ui-disposicion-panel__marca">Panel</div>

        {hrefTienda ? (
          <a href={hrefTienda} className="ui-disposicion-panel__volver">
            ← Volver a la tienda
          </a>
        ) : null}

        <nav className="ui-disposicion-panel__nav" aria-label="Secciones del panel">
          {secciones.map((seccion) => (
            <button
              key={seccion.id}
              type="button"
              className={
                seccion.id === seccionActiva
                  ? "ui-disposicion-panel__seccion ui-disposicion-panel__seccion--activa"
                  : "ui-disposicion-panel__seccion"
              }
              onClick={() => onSeccion(seccion.id)}
              aria-current={seccion.id === seccionActiva ? "page" : undefined}
            >
              {seccion.etiqueta}
            </button>
          ))}
        </nav>

        <div className="ui-disposicion-panel__usuario">
          <div className="ui-disposicion-panel__usuario-datos">
            <span className="ui-disposicion-panel__avatar" aria-hidden="true">
              {nombreUsuario.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <span className="ui-disposicion-panel__usuario-texto">
              <span className="ui-disposicion-panel__nombre">{nombreUsuario}</span>
              <Insignia tono="marca">{rolUsuario}</Insignia>
            </span>
          </div>

          <div className="ui-disposicion-panel__usuario-acciones">
            <AlternarTema />
            {onSalir ? (
              <button type="button" className="ui-disposicion-panel__salir" onClick={onSalir}>
                Salir
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <main className="ui-disposicion-panel__contenido">{children}</main>
    </div>
  );
}
