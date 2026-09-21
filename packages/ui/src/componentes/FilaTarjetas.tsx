import type { ReactNode } from "react";

import "./estilos/fila-tarjetas.css";

export interface PropsFilaTarjetas {
  children: ReactNode;
}

/** Bloque principal + uno secundario (info, ayuda) lado a lado desde tablet;
    apilados en movil (FIRST MOBILE). El segundo hijo queda mas angosto. */
export function FilaTarjetas({ children }: PropsFilaTarjetas) {
  return <div className="ui-fila-tarjetas">{children}</div>;
}
