import type { ReactNode } from "react";

import "./estilos/fila-campos.css";

export interface PropsFilaCampos {
  children: ReactNode;
}

/** Dos campos lado a lado desde tablet; apilados en movil (FIRST MOBILE). */
export function FilaCampos({ children }: PropsFilaCampos) {
  return <div className="ui-fila-campos">{children}</div>;
}
