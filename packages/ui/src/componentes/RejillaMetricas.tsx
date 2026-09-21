import type { ReactNode } from "react";

import "./estilos/rejilla-metricas.css";

export interface PropsRejillaMetricas {
  children: ReactNode;
}

/** Fila de `TarjetaMetrica` que se reacomoda sola segun el ancho. */
export function RejillaMetricas({ children }: PropsRejillaMetricas) {
  return <div className="ui-rejilla-metricas">{children}</div>;
}
