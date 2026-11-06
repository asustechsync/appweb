import type { ReactNode } from "react";

import "./par-de-tarjetas.css";

export interface PropsParDeTarjetas {
  /** Tarjeta principal: la columna ancha. */
  principal: ReactNode;
  /** Tarjeta de apoyo: la columna angosta. */
  lateral: ReactNode;
}

/** Dos tarjetas lado a lado desde tablet; en movil, una bajo la otra. */
export function ParDeTarjetas({ principal, lateral }: PropsParDeTarjetas) {
  return (
    <div className="ui-par-de-tarjetas">
      <div className="ui-par-de-tarjetas__celda">{principal}</div>
      <div className="ui-par-de-tarjetas__celda">{lateral}</div>
    </div>
  );
}
