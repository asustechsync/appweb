"use client";

import { IconoEstrella, IconoEstrellaRellena } from "../../iconos";

import "../estilos.css";

export interface PropsSelectorEstrellas {
  id: string;
  etiqueta: string;
  /** 0 = sin elegir. */
  valor: number;
  onCambio: (valor: number) => void;
  error?: string | null;
  disabled?: boolean;
}

const TEXTOS = ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

/**
 * Elegir de 1 a 5 estrellas. Son cinco radios de verdad: se eligen con
 * flechas desde el teclado y el lector de pantalla lee "4 estrellas, Bueno".
 */
export function SelectorEstrellas({
  id,
  etiqueta,
  valor,
  onCambio,
  error,
  disabled,
}: PropsSelectorEstrellas) {
  return (
    <fieldset
      className="ui-selector-estrellas"
      aria-describedby={error ? `${id}-error` : undefined}
      disabled={disabled}
    >
      <legend className="ui-selector-estrellas__leyenda">{etiqueta}</legend>
      <div className="ui-selector-estrellas__fila">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="ui-selector-estrellas__opcion">
            <input
              type="radio"
              className="ui-solo-lectores"
              name={id}
              value={n}
              checked={valor === n}
              onChange={() => onCambio(n)}
            />
            <span className="ui-solo-lectores">
              {n} {n === 1 ? "estrella" : "estrellas"}, {TEXTOS[n - 1]}
            </span>
            {n <= valor ? (
              <IconoEstrellaRellena tamano={28} className="ui-selector-estrellas__llena" />
            ) : (
              <IconoEstrella tamano={28} className="ui-selector-estrellas__vacia" />
            )}
          </label>
        ))}
        {valor > 0 ? (
          <span className="ui-selector-estrellas__texto" aria-hidden="true">
            {TEXTOS[valor - 1]}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="ui-campo__error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
