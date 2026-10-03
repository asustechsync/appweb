"use client";

import { claseEtiquetaOculta, type EtiquetaOculta } from "./claseEtiqueta";
import "./primitivos.css";

export interface OpcionDeSelect {
  valor: string;
  etiqueta: string;
}

export interface PropsCampoSelect {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionDeSelect[];
  onCambio: (valor: string) => void;
  disabled?: boolean;
  /** Oculta la etiqueta visualmente pero la deja para lectores de pantalla. */
  etiquetaOculta?: EtiquetaOculta;
}

/** Desplegable con su etiqueta. Mismo alto y borde que `Campo`. */
export function CampoSelect({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  disabled,
  etiquetaOculta,
}: PropsCampoSelect) {
  return (
    <div className="ui-campo">
      <label htmlFor={id} className={claseEtiquetaOculta(etiquetaOculta)}>
        {etiqueta}
      </label>
      <select
        id={id}
        name={id}
        className="ui-campo__input ui-campo__select"
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        disabled={disabled}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
