import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsTarjeta {
  titulo?: string;
  /** Controles a la derecha del titulo: un boton, un buscador. */
  acciones?: ReactNode;
  /** Sin borde, fondo ni relleno: el contenido queda directo sobre la pagina. */
  sinMarco?: boolean;
  children: ReactNode;
}

/** Bloque de contenido del panel: un titulo, sus acciones y lo que lleve dentro. */
export function Tarjeta({ titulo, acciones, sinMarco, children }: PropsTarjeta) {
  return (
    <section className={sinMarco ? "ui-tarjeta ui-tarjeta--sin-marco" : "ui-tarjeta"}>
      {titulo || acciones ? (
        <header className="ui-tarjeta__cabecera">
          {titulo ? <h2 className="ui-tarjeta__titulo">{titulo}</h2> : null}
          {acciones ? <div className="ui-tarjeta__acciones">{acciones}</div> : null}
        </header>
      ) : null}
      <div className="ui-tarjeta__cuerpo">{children}</div>
    </section>
  );
}
