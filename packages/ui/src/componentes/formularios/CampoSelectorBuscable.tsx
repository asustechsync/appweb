"use client";

import { claseEtiquetaOculta, type EtiquetaOculta } from "../base/claseEtiqueta";
import { SelectorBuscable, type OpcionDeSelectorBuscable } from "./SelectorBuscable";

import "../estilos.css";

export interface PropsCampoSelectorBuscable {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionDeSelectorBuscable[];
  onCambio: (valor: string) => void;
  disabled?: boolean;
  /** Oculta la etiqueta visualmente pero la deja para lectores de pantalla. */
  etiquetaOculta?: EtiquetaOculta;
  placeholder?: string;
}

/**
 * Como `CampoSelectorLista`, pero escribiendo se filtran las opciones: para
 * listas largas (marcas, proveedores) donde buscar es mas rapido que desplazarse.
 */
export function CampoSelectorBuscable({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  disabled,
  etiquetaOculta,
  placeholder,
}: PropsCampoSelectorBuscable) {
  return (
    <div className="ui-campo">
      <label htmlFor={id} className={claseEtiquetaOculta(etiquetaOculta)}>
        {etiqueta}
      </label>
      <SelectorBuscable
        id={id}
        etiqueta={etiqueta}
        valor={valor}
        opciones={opciones}
        onCambio={onCambio}
        disabled={disabled}
        {...(placeholder ? { placeholder } : {})}
      />
    </div>
  );
}
