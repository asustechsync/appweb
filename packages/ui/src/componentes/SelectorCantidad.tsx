"use client";

import "./primitivos.css";

export interface PropsSelectorCantidad {
  valor: number;
  /** Tope superior. Normalmente el stock de la variante. */
  maximo: number;
  onCambio: (cantidad: number) => void;
  etiqueta?: string;
}

/**
 * Control de unidades (− n +).
 *
 * No decide topes por su cuenta: `maximo` llega resuelto de fuera, porque el
 * limite real es el stock y eso lo sabe el servidor, no este componente.
 */
export function SelectorCantidad({
  valor,
  maximo,
  onCambio,
  etiqueta = "Cantidad",
}: PropsSelectorCantidad) {
  return (
    <div className="ui-selector-cantidad" role="group" aria-label={etiqueta}>
      <button
        type="button"
        onClick={() => onCambio(valor - 1)}
        disabled={valor <= 1}
        aria-label="Quitar una unidad"
      >
        −
      </button>
      <span className="ui-selector-cantidad__valor" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        onClick={() => onCambio(valor + 1)}
        disabled={valor >= maximo}
        aria-label="Añadir una unidad"
      >
        +
      </button>
    </div>
  );
}
