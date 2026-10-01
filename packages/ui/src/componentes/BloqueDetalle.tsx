import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsBloqueDetalle {
  titulo: string;
  icono?: ReactNode;
  children: ReactNode;
  /** Borde marcado para lo que pide accion al cliente (cómo pagar). */
  destacado?: boolean;
}

/** Tarjeta de solo lectura con icono y titulo: envio, comprobante, pago. */
export function BloqueDetalle({ titulo, icono, children, destacado }: PropsBloqueDetalle) {
  return (
    <section className={destacado ? "ui-bloque-detalle ui-bloque-detalle--destacado" : "ui-bloque-detalle"}>
      <h2 className="ui-bloque-detalle__titulo">
        {icono ? (
          <span className="ui-bloque-detalle__icono" aria-hidden="true">
            {icono}
          </span>
        ) : null}
        {titulo}
      </h2>
      <div className="ui-bloque-detalle__cuerpo">{children}</div>
    </section>
  );
}

/** Dos `BloqueDetalle` lado a lado desde 48rem; apilados en movil. */
export function FilaDetalles({ children }: { children: ReactNode }) {
  return <div className="ui-bloque-detalle-fila">{children}</div>;
}
