import type { ReactNode } from "react";

import "./fila-tarjetas.css";

export interface PropsFilaTarjetas {
  children: ReactNode;
  /**
   * Las dos columnas terminan a la misma altura: el campo de varias lineas de
   * la primera y la ultima tarjeta de la segunda ocupan el sobrante.
   */
  mismoAlto?: boolean;
  /**
   * Todo dentro de un solo bloque: las tarjetas hijas pierden su caja y las
   * columnas se separan con una linea (vertical en escritorio, horizontal en movil).
   */
  unida?: boolean;
  /** Oculta la fila sin desmontarla: lo escrito dentro se conserva al volver. */
  oculta?: boolean;
}

/** Bloque principal + uno secundario (info, ayuda) lado a lado desde tablet;
    apilados en movil (FIRST MOBILE). El segundo hijo queda mas angosto. */
export function FilaTarjetas({ children, mismoAlto, unida, oculta }: PropsFilaTarjetas) {
  const clases = ["ui-fila-tarjetas"];
  if (mismoAlto) clases.push("ui-fila-tarjetas--mismo-alto");
  if (unida) clases.push("ui-fila-tarjetas--unida");
  return (
    <div className={clases.join(" ")} hidden={oculta}>
      {children}
    </div>
  );
}
