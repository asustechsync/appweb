import type { ReactNode } from "react";

import "./fila-graficos.css";

export interface PropsFilaGraficos {
  /** La columna ancha (graficos) y, a su lado, la angosta (lista de pagos). */
  children: ReactNode;
}

/** Dos columnas lado a lado desde escritorio: cinco octavos y tres octavos. En movil, una bajo otra. */
export function FilaGraficos({ children }: PropsFilaGraficos) {
  return <div className="ui-fila-graficos">{children}</div>;
}

export interface PropsPilaGraficos {
  /** Graficos uno bajo otro; el ultimo estira hasta el alto de la columna vecina. */
  children: ReactNode;
}

/** Varios graficos apilados dentro de una columna de `FilaGraficos`. */
export function PilaGraficos({ children }: PropsPilaGraficos) {
  return <div className="ui-fila-graficos__pila">{children}</div>;
}
