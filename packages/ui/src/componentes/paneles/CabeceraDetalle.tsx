import type { ReactNode } from "react";

import "./cabecera-detalle.css";

export interface PropsCabeceraDetalle {
  /** "Pago de 261024-0002". */
  titulo: string;
  /** No se ve, pero sigue siendo el encabezado de la pagina para lectores de pantalla. */
  ocultarTitulo?: boolean;
  /** Entre el titulo y las acciones: pestañas o un selector de vista. */
  centro?: ReactNode;
  /** Botones a la derecha: "Ver pedido", "Volver a pagos". */
  acciones?: ReactNode;
}

/**
 * Titulo de una vista de detalle, suelto sobre el fondo de la pagina y fuera
 * de la tarjeta que tiene debajo. En movil las acciones bajan bajo el titulo.
 */
export function CabeceraDetalle({ titulo, ocultarTitulo, centro, acciones }: PropsCabeceraDetalle) {
  return (
    <header className="ui-cabecera-detalle">
      <h1
        className={
          ocultarTitulo
            ? "ui-cabecera-detalle__titulo ui-solo-lectores"
            : "ui-cabecera-detalle__titulo"
        }
      >
        {titulo}
      </h1>
      {centro ? <div className="ui-cabecera-detalle__centro">{centro}</div> : null}
      {acciones ? <div className="ui-cabecera-detalle__acciones">{acciones}</div> : null}
    </header>
  );
}
