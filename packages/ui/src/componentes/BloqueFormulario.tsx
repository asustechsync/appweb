import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsBloqueFormulario {
  titulo: string;
  children: ReactNode;
}

/** Grupo de campos de un formulario largo, con su titulo encima. */
export function BloqueFormulario({ titulo, children }: PropsBloqueFormulario) {
  return (
    <section className="ui-bloque-formulario">
      <h3 className="ui-bloque-formulario__titulo">{titulo}</h3>
      {children}
    </section>
  );
}
