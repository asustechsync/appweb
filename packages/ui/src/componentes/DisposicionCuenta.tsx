"use client";

import type { ReactNode } from "react";

import { IconoFlechaDerecha, IconoFlechaIzquierda } from "../iconos";
import { Contenedor } from "./Contenedor";
import { Insignia } from "./Insignia";

import "./primitivos.css";

export interface SeccionDeCuenta {
  id: string;
  etiqueta: string;
  /** Con `href` la entrada es un enlace a otra pagina, no una seccion de la cuenta. */
  href?: string;
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
  /**
   * Menu de ajustes para movil (normalmente un `MenuCuenta`). Con el, en movil
   * la cuenta es de dos pantallas: el menu, o una seccion con flecha de volver.
   * Desde `lg` no se usa y queda el lateral de siempre.
   */
  menuMovil?: ReactNode;
  /** En movil, mostrar el menu en vez de la seccion. */
  enMenu?: boolean;
  /** Titulo de la barra movil cuando se ve una seccion. */
  tituloSeccion?: string;
  /** Flecha de la barra movil en una seccion: vuelve al menu. */
  onVolver?: () => void;
  /** Flecha de la barra movil en el menu: sale de la cuenta. */
  hrefSalirMenu?: string;
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
  menuMovil,
  enMenu = false,
  tituloSeccion,
  onVolver,
  hrefSalirMenu = "/",
  children,
}: PropsDisposicionCuenta) {
  const clase = menuMovil
    ? `ui-disposicion-cuenta ui-disposicion-cuenta--con-menu ${enMenu ? "ui-disposicion-cuenta--en-menu" : ""}`
    : "ui-disposicion-cuenta";

  return (
    <Contenedor>
      <div className={clase}>
        {menuMovil ? (
          <div className="ui-disposicion-cuenta__barra-movil">
            {enMenu ? (
              <a href={hrefSalirMenu} className="ui-disposicion-cuenta__volver" aria-label="Volver a la tienda">
                <IconoFlechaIzquierda />
              </a>
            ) : (
              <button
                type="button"
                className="ui-disposicion-cuenta__volver"
                onClick={onVolver}
                aria-label="Volver a mi cuenta"
              >
                <IconoFlechaIzquierda />
              </button>
            )}
            <h1>{enMenu ? titulo : (tituloSeccion ?? titulo)}</h1>
          </div>
        ) : null}
        {menuMovil ? <div className="ui-disposicion-cuenta__menu-movil">{menuMovil}</div> : null}

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
              {secciones.map((seccion) =>
                seccion.href ? (
                  <a key={seccion.id} href={seccion.href} className="ui-disposicion-cuenta__pestana">
                    {seccion.etiqueta}
                  </a>
                ) : (
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
                ),
              )}
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
                Panel de administracion
                <IconoFlechaDerecha tamano={16} />
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
