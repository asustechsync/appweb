import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsInsignia {
  children: ReactNode;
  tono?: "neutro" | "exito" | "alerta" | "error" | "marca";
}

/** Etiqueta corta de estado: un rol, "Activo", el estado de un pedido. */
export function Insignia({ children, tono = "neutro" }: PropsInsignia) {
  return <span className={`ui-insignia ui-insignia--${tono}`}>{children}</span>;
}
