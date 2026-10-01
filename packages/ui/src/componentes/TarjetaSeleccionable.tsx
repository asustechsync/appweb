"use client";

import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsTarjetaSeleccionable {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  disabled?: boolean;
  /** Icono a la izquierda del texto: una ubicacion, un medio de pago. */
  icono?: ReactNode;
  /** Dato a la derecha: el costo de un envio, una insignia. */
  extra?: ReactNode;
}

/**
 * Tarjeta con radio nativo: una direccion, un medio de pago, un tipo de
 * comprobante — cualquier "elige uno de varios" donde cada opcion necesita
 * mas de una linea de texto. Se agrupan con `GrupoOpciones`.
 */
export function TarjetaSeleccionable({
  name,
  value,
  checked,
  onChange,
  children,
  disabled,
  icono,
  extra,
}: PropsTarjetaSeleccionable) {
  return (
    <label
      className={
        checked
          ? "ui-tarjeta-seleccionable ui-tarjeta-seleccionable--elegida"
          : "ui-tarjeta-seleccionable"
      }
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {icono ? (
        <span className="ui-tarjeta-seleccionable__icono" aria-hidden="true">
          {icono}
        </span>
      ) : null}
      <div className="ui-tarjeta-seleccionable__contenido">{children}</div>
      {extra ? <div className="ui-tarjeta-seleccionable__extra">{extra}</div> : null}
    </label>
  );
}
