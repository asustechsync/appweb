"use client";

import { useEffect, useRef } from "react";

import "./primitivos.css";

export interface PropsCabeceraLineas {
  /** Todas las lineas marcadas. */
  todas: boolean;
  /** Alguna marcada, pero no todas: la casilla queda a medias. */
  algunas: boolean;
  onTodas: (marcar: boolean) => void;
}

/**
 * Titulos de las columnas de LineaDeCarrito con la casilla de "seleccionar
 * todo". En movil solo queda la casilla, porque las lineas van apiladas.
 */
export function CabeceraLineas({ todas, algunas, onTodas }: PropsCabeceraLineas) {
  const casilla = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (casilla.current) casilla.current.indeterminate = algunas && !todas;
  }, [algunas, todas]);

  return (
    <div className="ui-cabecera-lineas">
      <input
        ref={casilla}
        type="checkbox"
        className="ui-linea-carrito__casilla"
        checked={todas}
        onChange={(evento) => onTodas(evento.target.checked)}
        aria-label="Seleccionar todos"
      />
      <span>Producto</span>
      <span className="ui-cabecera-lineas__columna">Cantidad</span>
      <span className="ui-cabecera-lineas__columna ui-cabecera-lineas__columna--fin">Precio</span>
    </div>
  );
}
