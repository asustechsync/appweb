import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsTarjeta {
  titulo?: string;
  /** Controles a la derecha del titulo: un boton, un buscador. */
  acciones?: ReactNode;
  children: ReactNode;
}

/** Bloque de contenido del panel: un titulo, sus acciones y lo que lleve dentro. */
export function Tarjeta({ titulo, acciones, children }: PropsTarjeta) {
  return (
    <section className="ui-tarjeta">
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
