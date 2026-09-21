"use client";

import { SelectorLista, type OpcionDeSelectorLista } from "./SelectorLista";

import "./primitivos.css";

export interface PropsCampoSelectorLista {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionDeSelectorLista[];
  onCambio: (valor: string) => void;
  disabled?: boolean;
  /** Oculta la etiqueta visualmente pero la deja para lectores de pantalla. */
  etiquetaOculta?: boolean;
  /** Texto cuando no hay nada elegido. Por defecto, repite `etiqueta`. */
  placeholder?: string;
}

/**
 * Como `CampoSelect`, pero con el mismo look que `SelectorBuscable` (panel de
 * 4 opciones con scroll) sin permitir escribir: para listas cortas donde
 * escribir no aporta nada (genero, tipo de documento).
 */
export function CampoSelectorLista({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  disabled,
  etiquetaOculta,
  placeholder,
}: PropsCampoSelectorLista) {
  return (
    <div className="ui-campo">
      <label htmlFor={id} className={etiquetaOculta ? "ui-solo-lectores" : undefined}>
        {etiqueta}
      </label>
      <SelectorLista
        id={id}
        etiqueta={etiqueta}
        valor={valor}
        opciones={opciones}
        onCambio={onCambio}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
