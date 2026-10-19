import type { ReactNode } from "react";

import "../estilos.css";

export interface PropsSeccionCheckout {
  numero: number;
  titulo: string;
  /** Linea bajo el titulo: para que sirve el paso. */
  descripcion?: string;
  /** A la derecha del titulo: "Editar", "Agregar". */
  accion?: ReactNode;
  children: ReactNode;
}

/** Un paso del checkout: numero, titulo y su contenido, siempre con el mismo aspecto. */
export function SeccionCheckout({
  numero,
  titulo,
  descripcion,
  accion,
  children,
}: PropsSeccionCheckout) {
  return (
    <section className="ui-seccion-checkout">
      <header className="ui-seccion-checkout__cabecera">
        <span className="ui-seccion-checkout__numero" aria-hidden="true">
          {numero}
        </span>
        <div className="ui-seccion-checkout__textos">
          <h2 className="ui-seccion-checkout__titulo">{titulo}</h2>
          {descripcion ? <p className="ui-seccion-checkout__descripcion">{descripcion}</p> : null}
        </div>
        {accion ? <div className="ui-seccion-checkout__accion">{accion}</div> : null}
      </header>
      <div className="ui-seccion-checkout__contenido">{children}</div>
    </section>
  );
}

/** Datos ya conocidos dentro de una seccion (nombre, correo, telefono), uno por linea. */
export function DatosSeccion({ children }: { children: ReactNode }) {
  return <p className="ui-seccion-checkout__datos">{children}</p>;
}
