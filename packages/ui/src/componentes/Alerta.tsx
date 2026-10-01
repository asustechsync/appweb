import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsAlerta {
  tono?: "error" | "exito" | "info";
  centrada?: boolean;
  children: ReactNode;
}

/** Mensaje de estado corto: clave incorrecta, pedido confirmado, un aviso. */
export function Alerta({ tono = "info", centrada = false, children }: PropsAlerta) {
  return (
    <p className={`ui-alerta ui-alerta--${tono}${centrada ? " ui-alerta--centrada" : ""}`} role={tono === "error" ? "alert" : undefined}>
      {children}
    </p>
  );
}
