"use client";

import "../estilos.css";

export interface PropsCampoTexto {
  id: string;
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string | null;
  requerido?: boolean;
  placeholder?: string;
  /** Alto inicial en lineas. Se puede estirar hacia abajo. */
  filas?: number;
  disabled?: boolean;
}

/**
 * Texto de varias lineas (descripciones, notas largas). Misma etiqueta, borde
 * y error que `Campo`, para que un formulario se vea de una sola pieza.
 */
export function CampoTexto({
  id,
  etiqueta,
  valor,
  onCambio,
  error,
  requerido,
  placeholder,
  filas = 4,
  disabled,
}: PropsCampoTexto) {
  return (
    <div className="ui-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <textarea
        id={id}
        name={id}
        rows={filas}
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        required={requerido}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={
          error
            ? "ui-campo__input ui-campo__input--multilinea ui-campo__input--error"
            : "ui-campo__input ui-campo__input--multilinea"
        }
      />
      {error ? (
        <p id={`${id}-error`} className="ui-campo__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
