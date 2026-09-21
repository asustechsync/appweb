"use client";

import type { ReactNode } from "react";

import { Contenedor } from "./Contenedor";
import { Insignia } from "./Insignia";

import "./primitivos.css";

export interface SeccionDeCuenta {
  id: string;
  etiqueta: string;
}

export interface PropsDisposicionCuenta {
  titulo: string;
  subtitulo?: string;
  nombreUsuario: string;
  rolUsuario?: string;
  secciones: SeccionDeCuenta[];
  seccionActiva: string;
  onSeccion: (id: string) => void;
  onSalir?: () => void;
  hrefPanel?: string;
  children: ReactNode;
}

/**
 * Disposicion de /mi-cuenta: panel lateral con la tarjeta del usuario y las
 * pestañas de seccion debajo, y el contenido a un lado.
 *
 * En movil la tarjeta y las pestañas se apilan sobre el contenido — recien
 * desde el quiebre `lg` el lateral pasa a columna fija junto al contenido.
 * No navega ni cierra sesion: avisa con `onSeccion` y `onSalir`.
 */
export function DisposicionCuenta({
  titulo,
  subtitulo,
  nombreUsuario,
  rolUsuario,
  secciones,
  seccionActiva,
  onSeccion,
  onSalir,
  hrefPanel,
  children,
}: PropsDisposicionCuenta) {
  return (
    <Contenedor>
      <div className="ui-disposicion-cuenta">
        <header className="ui-disposicion-cuenta__cabecera">
          <h1>{titulo}</h1>
          {subtitulo ? <p>{subtitulo}</p> : null}
        </header>

        <div className="ui-disposicion-cuenta__cuerpo">
          <aside className="ui-disposicion-cuenta__lateral">
            <div className="ui-disposicion-cuenta__tarjeta-usuario">
              <div className="ui-disposicion-cuenta__portada" aria-hidden="true" />
              <div className="ui-disposicion-cuenta__cuerpo-usuario">
                <span className="ui-disposicion-cuenta__avatar" aria-hidden="true">
                  {nombreUsuario.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <span className="ui-disposicion-cuenta__usuario-texto">
                  <span className="ui-disposicion-cuenta__nombre">{nombreUsuario}</span>
                  <span className="ui-disposicion-cuenta__usuario-insignias">
                    {rolUsuario ? <Insignia tono="marca">{rolUsuario}</Insignia> : null}
                    <span className="ui-disposicion-cuenta__activa">
                      <i aria-hidden="true" />
                      Activa
                    </span>
                  </span>
                </span>
              </div>
            </div>

            <nav className="ui-disposicion-cuenta__pestanas" aria-label="Secciones de mi cuenta">
              {secciones.map((seccion) => (
                <button
                  key={seccion.id}
                  type="button"
                  className={
                    seccion.id === seccionActiva
                      ? "ui-disposicion-cuenta__pestana ui-disposicion-cuenta__pestana--activa"
                      : "ui-disposicion-cuenta__pestana"
                  }
                  onClick={() => onSeccion(seccion.id)}
                  aria-current={seccion.id === seccionActiva ? "page" : undefined}
                >
                  {seccion.etiqueta}
                </button>
              ))}
              {onSalir ? (
                <button
                  type="button"
                  className="ui-disposicion-cuenta__pestana ui-disposicion-cuenta__pestana--salir"
                  onClick={onSalir}
                >
                  Salir
                </button>
              ) : null}
            </nav>

            {hrefPanel ? (
              <a href={hrefPanel} className="ui-disposicion-cuenta__ir-panel">
                Panel de administracion →
              </a>
            ) : null}
          </aside>

          <div className="ui-disposicion-cuenta__principal">
            <div className="ui-disposicion-cuenta__contenido">{children}</div>
          </div>
        </div>
      </div>
    </Contenedor>
  );
}
