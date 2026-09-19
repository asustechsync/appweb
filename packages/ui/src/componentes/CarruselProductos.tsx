import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsCarruselProductos {
  children: ReactNode;
  /** Nombre accesible de la region, para lectores de pantalla. */
  etiqueta?: string;
}

/**
 * Fila de tarjetas que se desliza en horizontal, una sola linea. Muestra
 * ~6 tarjetas en escritorio; el resto se llega deslizando con el dedo, el
 * trackpad o la rueda del mouse.
 *
 * Scroll nativo con snap, sin una linea de JavaScript: sigue siendo Clase A.
 * FIRST MOBILE: cuantas tarjetas se ven por vez sube por quiebres via la
 * variable `--visibles` en el CSS; aqui no hay medidas.
 */
export function CarruselProductos({ children, etiqueta = "Productos" }: PropsCarruselProductos) {
  return (
    <div className="ui-carrusel-productos" role="region" aria-label={etiqueta}>
      <div className="ui-carrusel-productos__pista">{children}</div>
    </div>
  );
}
