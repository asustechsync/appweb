"use client";

import "./primitivos.css";

export interface PropsCasilla {
  id: string;
  etiqueta: string;
  marcada: boolean;
  onCambio: (marcada: boolean) => void;
  disabled?: boolean;
}

/** Casilla de verificacion con su etiqueta: "Recordarme", "Acepto los terminos". */
export function Casilla({ id, etiqueta, marcada, onCambio, disabled }: PropsCasilla) {
  return (
    <label className="ui-casilla" htmlFor={id}>
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={marcada}
        onChange={(evento) => onCambio(evento.target.checked)}
        disabled={disabled}
      />
      <span>{etiqueta}</span>
    </label>
  );
}
