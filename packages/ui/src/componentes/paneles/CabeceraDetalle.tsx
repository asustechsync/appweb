import type { ReactNode } from "react";

import "./cabecera-detalle.css";

export interface PropsCabeceraDetalle {
  /** "Pago de 261024-0002". */
  titulo: string;
  /** Botones a la derecha: "Ver pedido", "Volver a pagos". */
  acciones?: ReactNode;
}

/**
 * Titulo de una vista de detalle, suelto sobre el fondo de la pagina y fuera
 * de la tarjeta que tiene debajo. En movil las acciones bajan bajo el titulo.
 */
export function CabeceraDetalle({ titulo, acciones }: PropsCabeceraDetalle) {
  return (
    <header className="ui-cabecera-detalle">
      <h1 className="ui-cabecera-detalle__titulo">{titulo}</h1>
      {acciones ? <div className="ui-cabecera-detalle__acciones">{acciones}</div> : null}
    </header>
  );
}
