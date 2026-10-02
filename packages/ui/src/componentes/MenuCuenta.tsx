"use client";

import type { ReactNode } from "react";

import { IconoFlechaDerecha, IconoSalir } from "../iconos";

import "./primitivos.css";

export interface OpcionMenuCuenta {
  id: string;
  etiqueta: string;
  icono: ReactNode;
  /** Abre una seccion de la cuenta (avisa con `onSeccion`). */
  seccion?: string;
  /** Lleva a otra pagina. */
  href?: string;
  /** Texto a la derecha, antes del chevron (p. ej. "Español"). */
  valor?: string;
  /** Control propio a la derecha (p. ej. un interruptor); quita el chevron. */
  control?: ReactNode;
}

export interface GrupoMenuCuenta {
  titulo?: string;
  opciones: OpcionMenuCuenta[];
}

export interface PropsMenuCuenta {
  /** Sin nombre no hay tarjeta de usuario: queda solo la lista de opciones. */
  nombreUsuario?: string;
  descripcionUsuario?: string;
  /** Seccion que abre la tarjeta del usuario. */
  seccionUsuario?: string;
  grupos: GrupoMenuCuenta[];
  onSeccion: (id: string) => void;
  onSalir?: () => void;
}

/**
 * Menu de ajustes de la cuenta en movil: tarjeta del usuario arriba, grupos
 * de filas con icono y chevron, y "Cerrar sesion" aparte al final.
 */
export function MenuCuenta({
  nombreUsuario,
  descripcionUsuario,
  seccionUsuario,
  grupos,
  onSeccion,
  onSalir,
}: PropsMenuCuenta) {
  return (
    <nav className="ui-menu-cuenta" aria-label="Ajustes de mi cuenta">
      {nombreUsuario ? (
        <button
          type="button"
          className="ui-menu-cuenta__usuario"
          onClick={() => (seccionUsuario ? onSeccion(seccionUsuario) : undefined)}
        >
          <span className="ui-menu-cuenta__avatar" aria-hidden="true">
            {nombreUsuario.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span className="ui-menu-cuenta__usuario-texto">
            <span className="ui-menu-cuenta__nombre">{nombreUsuario}</span>
            {descripcionUsuario ? (
              <span className="ui-menu-cuenta__descripcion">{descripcionUsuario}</span>
            ) : null}
          </span>
          <IconoFlechaDerecha className="ui-menu-cuenta__chevron" />
        </button>
      ) : null}

      {grupos.map((grupo, indice) => (
        <section key={grupo.titulo ?? indice} className="ui-menu-cuenta__grupo">
          {grupo.titulo ? <h2 className="ui-menu-cuenta__titulo">{grupo.titulo}</h2> : null}
          <ul className="ui-menu-cuenta__lista">
            {grupo.opciones.map((opcion) => (
              <li key={opcion.id}>
                <FilaMenu opcion={opcion} onSeccion={onSeccion} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {onSalir ? (
        <button type="button" className="ui-menu-cuenta__salir" onClick={onSalir}>
          <IconoSalir className="ui-menu-cuenta__icono" />
          Cerrar sesión
        </button>
      ) : null}
    </nav>
  );
}

function FilaMenu({ opcion, onSeccion }: { opcion: OpcionMenuCuenta; onSeccion: (id: string) => void }) {
  const contenido = (
    <>
      <span className="ui-menu-cuenta__icono">{opcion.icono}</span>
      <span className="ui-menu-cuenta__etiqueta">{opcion.etiqueta}</span>
      {opcion.valor ? <span className="ui-menu-cuenta__valor">{opcion.valor}</span> : null}
      {opcion.control ?? <IconoFlechaDerecha className="ui-menu-cuenta__chevron" />}
    </>
  );

  if (opcion.control) return <div className="ui-menu-cuenta__fila">{contenido}</div>;
  // Solo informativa (p. ej. el idioma, que por ahora es uno): sin chevron.
  if (!opcion.href && !opcion.seccion) {
    return (
      <div className="ui-menu-cuenta__fila">
        <span className="ui-menu-cuenta__icono">{opcion.icono}</span>
        <span className="ui-menu-cuenta__etiqueta">{opcion.etiqueta}</span>
        {opcion.valor ? <span className="ui-menu-cuenta__valor">{opcion.valor}</span> : null}
      </div>
    );
  }
  if (opcion.href) {
    return (
      <a href={opcion.href} className="ui-menu-cuenta__fila">
        {contenido}
      </a>
    );
  }
  const seccion = opcion.seccion;
  return (
    <button
      type="button"
      className="ui-menu-cuenta__fila"
      onClick={seccion ? () => onSeccion(seccion) : undefined}
    >
      {contenido}
    </button>
  );
}
