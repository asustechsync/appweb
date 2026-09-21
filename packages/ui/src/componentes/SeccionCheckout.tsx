import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsSeccionCheckout {
  numero: number;
  titulo: string;
  children: ReactNode;
}

/** Un paso del checkout: numero, titulo y su contenido, siempre con el mismo aspecto. */
export function SeccionCheckout({ numero, titulo, children }: PropsSeccionCheckout) {
  return (
    <section className="ui-seccion-checkout">
      <h2 className="ui-seccion-checkout__titulo">
        <span className="ui-seccion-checkout__numero">{numero}</span>
        {titulo}
      </h2>
      <div className="ui-seccion-checkout__contenido">{children}</div>
    </section>
  );
}
