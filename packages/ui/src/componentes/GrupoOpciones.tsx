import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsGrupoOpciones {
  /** Nombre del grupo para lectores de pantalla. */
  etiqueta: string;
  children: ReactNode;
  /** Dos columnas desde 40rem (boleta/factura, medios de pago). */
  columnas?: 1 | 2;
}

/** Agrupa varias `TarjetaSeleccionable` del mismo radio. */
export function GrupoOpciones({ etiqueta, children, columnas = 1 }: PropsGrupoOpciones) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className={columnas === 2 ? "ui-grupo-opciones ui-grupo-opciones--2" : "ui-grupo-opciones"}
    >
      {children}
    </div>
  );
}
