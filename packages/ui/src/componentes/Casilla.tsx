"use client";

import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsCasilla {
  id: string;
  /** Texto, o texto con enlaces (Acepto los Terminos...). */
  etiqueta: ReactNode;
  marcada: boolean;
  onCambio: (marcada: boolean) => void;
  disabled?: boolean;
  /** El formulario no se envia sin marcarla. */
  requerida?: boolean;
}

/** Casilla de verificacion con su etiqueta: "Recordarme", "Acepto los terminos". */
export function Casilla({ id, etiqueta, marcada, onCambio, disabled, requerida }: PropsCasilla) {
  return (
    <label className="ui-casilla" htmlFor={id}>
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={marcada}
        onChange={(evento) => onCambio(evento.target.checked)}
        disabled={disabled}
        required={requerida}
      />
      <span>{etiqueta}</span>
    </label>
  );
}
