"use client";

import { claseEtiquetaOculta, type EtiquetaOculta } from "../base/claseEtiqueta";
import { SelectorLista, type OpcionDeSelectorLista } from "./SelectorLista";

import "../estilos.css";

export interface PropsCampoSelectorLista {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionDeSelectorLista[];
  onCambio: (valor: string) => void;
  disabled?: boolean;
  /** Oculta la etiqueta visualmente pero la deja para lectores de pantalla. */
  etiquetaOculta?: EtiquetaOculta;
  /** Texto cuando no hay nada elegido. Por defecto, repite `etiqueta`. */
  placeholder?: string;
  /** "amplio": ancho minimo fijo, para un selector suelto (p. ej. un periodo)
      que no debe quedar tan justo como su texto. */
  ancho?: "auto" | "amplio";
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
  ancho = "auto",
}: PropsCampoSelectorLista) {
  return (
    <div className={ancho === "amplio" ? "ui-campo ui-campo--amplio" : "ui-campo"}>
      <label htmlFor={id} className={claseEtiquetaOculta(etiquetaOculta)}>
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
