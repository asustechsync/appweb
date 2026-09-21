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
}

/**
 * Tarjeta con radio nativo: una direccion, un medio de pago, un tipo de
 * comprobante — cualquier "elige uno de varios" donde cada opcion necesita
 * mas de una linea de texto. El envio del carrito usa su propio radio dentro
 * de ResumenCompra porque es mas simple; este es el mismo patron para cuando
 * el contenido no cabe en una sola linea.
 */
export function TarjetaSeleccionable({
  name,
  value,
  checked,
  onChange,
  children,
  disabled,
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
      <div className="ui-tarjeta-seleccionable__contenido">{children}</div>
    </label>
  );
}
