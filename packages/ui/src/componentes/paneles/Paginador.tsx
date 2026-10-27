import { IconoFlechaDerecha, IconoFlechaIzquierda } from "../../iconos";

import "./paginador.css";

export interface PropsPaginador {
  /** Pagina actual, desde 1. */
  pagina: number;
  /** Cuantas paginas hay. Con una o ninguna, no se pinta. */
  paginas: number;
  onCambio: (pagina: number) => void;
}

/**
 * Flechas con la pagina actual, para la barra de un listado: "‹ 1 / 2 ›".
 * Blanco y sin borde, como los selectores de al lado.
 */
export function Paginador({ pagina, paginas, onCambio }: PropsPaginador) {
  if (paginas <= 1) return null;
  return (
    <nav className="ui-paginador" aria-label="Paginas">
      <button
        type="button"
        className="ui-paginador__flecha"
        aria-label="Pagina anterior"
        disabled={pagina <= 1}
        onClick={() => onCambio(pagina - 1)}
      >
        <IconoFlechaIzquierda tamano={16} />
      </button>
      <span className="ui-paginador__estado" aria-live="polite">
        {pagina} / {paginas}
      </span>
      <button
        type="button"
        className="ui-paginador__flecha"
        aria-label="Pagina siguiente"
        disabled={pagina >= paginas}
        onClick={() => onCambio(pagina + 1)}
      >
        <IconoFlechaDerecha tamano={16} />
      </button>
    </nav>
  );
}
