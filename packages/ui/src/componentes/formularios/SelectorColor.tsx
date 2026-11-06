"use client";

import "../estilos.css";
import "./selector-color.css";

export interface PropsSelectorColor {
  id: string;
  etiqueta: string;
  /** Hex ("#1E2A4A"), o "" si aun no tiene muestra. */
  valor: string;
  onCambio: (valor: string) => void;
  disabled?: boolean;
}

/** Hex completo de seis digitos: lo unico que acepta la paleta nativa. */
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Muestra de color: la paleta del sistema para elegir el tono con un clic y,
 * al lado, el hex por si se copia de otro sitio. Los dos editan el mismo valor.
 */
export function SelectorColor({ id, etiqueta, valor, onCambio, disabled }: PropsSelectorColor) {
  return (
    <div className="ui-campo">
      <label htmlFor={`${id}-hex`}>{etiqueta}</label>
      <div className="ui-selector-color">
        <input
          id={id}
          type="color"
          className="ui-selector-color__paleta"
          aria-label={`${etiqueta}: elegir en la paleta`}
          // Sin muestra, la paleta abre en gris medio en vez del negro por defecto.
          value={HEX.test(valor) ? valor : "#808080"}
          onChange={(evento) => onCambio(evento.target.value.toUpperCase())}
          disabled={disabled}
        />
        <input
          id={`${id}-hex`}
          className="ui-campo__input"
          value={valor}
          onChange={(evento) => onCambio(evento.target.value)}
          placeholder="#1E2A4A"
          spellCheck={false}
          autoComplete="off"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
