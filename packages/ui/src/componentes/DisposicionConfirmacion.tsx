import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsDisposicionConfirmacion {
  titulo: string;
  texto: string;
  /** Codigo del pedido, en su propia pastilla bajo el texto. */
  codigo: string;
  /** Fecha ya formateada: "1 oct 2026, 15:42". */
  fecha: string;
  /** Columna principal: seguimiento, pago, envio. */
  children: ReactNode;
  /** Columna lateral: el recibo. */
  lateral: ReactNode;
  /** Botones al pie: "Ver mis pedidos", "Seguir comprando". */
  acciones?: ReactNode;
}

/**
 * Pantalla de pedido confirmado: ilustracion de aprobacion arriba, detalle
 * en dos columnas desde 64rem (igual que DisposicionCompra) y acciones al pie.
 */
export function DisposicionConfirmacion({
  titulo,
  texto,
  codigo,
  fecha,
  children,
  lateral,
  acciones,
}: PropsDisposicionConfirmacion) {
  return (
    <div className="ui-confirmacion">
      <header className="ui-confirmacion__hero">
        <IlustracionAprobado />
        <h1 className="ui-confirmacion__titulo">{titulo}</h1>
        <p className="ui-confirmacion__texto">{texto}</p>
        <p className="ui-confirmacion__codigo">
          <span>Pedido</span>
          <strong>{codigo}</strong>
          <span aria-hidden="true">·</span>
          <time>{fecha}</time>
        </p>
      </header>

      <div className="ui-confirmacion__principal">{children}</div>
      <div className="ui-confirmacion__lateral">{lateral}</div>

      {acciones ? <div className="ui-confirmacion__acciones">{acciones}</div> : null}
    </div>
  );
}

/** Check dentro de dos anillos que se expanden una vez al cargar. */
function IlustracionAprobado() {
  return (
    <div className="ui-confirmacion__ilustracion" aria-hidden="true">
      <span className="ui-confirmacion__anillo" />
      <span className="ui-confirmacion__anillo ui-confirmacion__anillo--2" />
      <svg viewBox="0 0 64 64" className="ui-confirmacion__check">
        <circle cx="32" cy="32" r="30" />
        <path d="M19 33.5 28 42 45.5 23.5" />
      </svg>
    </div>
  );
}
