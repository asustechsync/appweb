import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsAlerta {
  tono?: "error" | "exito" | "info";
  children: ReactNode;
}

/** Mensaje de estado corto: clave incorrecta, pedido confirmado, un aviso. */
export function Alerta({ tono = "info", children }: PropsAlerta) {
  return (
    <p className={`ui-alerta ui-alerta--${tono}`} role={tono === "error" ? "alert" : undefined}>
      {children}
    </p>
  );
}
