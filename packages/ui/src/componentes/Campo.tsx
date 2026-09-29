"use client";

import { useState, type ReactNode } from "react";

import "flag-icons/css/flag-icons.min.css";
import "./primitivos.css";

import { IconoOjo, IconoOjoTachado } from "../iconos";
import { SelectorPais } from "./SelectorPais";

export interface PropsCampo {
  id: string;
  etiqueta: string;
  tipo?: "text" | "email" | "password" | "tel" | "date";
  valor: string;
  onCambio: (valor: string) => void;
  error?: string | null;
  requerido?: boolean;
  placeholder?: string;
  autoComplete?: string;
  /** Prefijo telefonico fijo antes del input ("+51"). Ignorado si se pasa
      `pais` + `onCambioPais`. */
  prefijo?: string;
  /** Codigo ISO 3166-1 alpha-2 en minuscula ("pe") para la bandera de
      `prefijo`, via flag-icons. Sin esto no se pinta ninguna bandera. */
  bandera?: string;
  /** iso2 del pais elegido. Junto con `onCambioPais` cambia el prefijo fijo
      por `SelectorPais`, buscable por nombre o numero. */
  pais?: string;
  onCambioPais?: (iso2: string) => void;
  disabled?: boolean;
  /** Enlace a la derecha de la etiqueta: "¿Olvidaste tu contraseña?". */
  enlaceEtiqueta?: ReactNode;
}

/**
 * Campo de texto con su etiqueta y su error, siempre juntos.
 *
 * Controlado desde fuera (valor + onCambio): quien lo usa decide cuando
 * valida y que mensaje muestra, este componente solo lo pinta.
 */
export function Campo({
  id,
  etiqueta,
  tipo = "text",
  valor,
  onCambio,
  error,
  requerido,
  placeholder,
  autoComplete,
  prefijo,
  bandera,
  pais,
  onCambioPais,
  disabled,
  enlaceEtiqueta,
}: PropsCampo) {
  const prefijoSeleccionable = pais !== undefined && onCambioPais !== undefined;
  const conPrefijoFijo = !prefijoSeleccionable && Boolean(prefijo);
  const [claveVisible, setClaveVisible] = useState(false);
  const esClave = tipo === "password";

  const input = (
    <input
      id={id}
      name={id}
      type={esClave && claveVisible ? "text" : tipo}
      value={valor}
      onChange={(evento) => onCambio(evento.target.value)}
      required={requerido}
      placeholder={placeholder}
      autoComplete={autoComplete}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={
        conPrefijoFijo
          ? "ui-campo__input ui-campo__input--con-prefijo"
          : error
            ? "ui-campo__input ui-campo__input--error"
            : "ui-campo__input"
      }
    />
  );

  return (
    <div className="ui-campo">
      {enlaceEtiqueta ? (
        <div className="ui-campo__etiqueta-fila">
          <label htmlFor={id}>{etiqueta}</label>
          {enlaceEtiqueta}
        </div>
      ) : (
        <label htmlFor={id}>{etiqueta}</label>
      )}
      {prefijoSeleccionable ? (
        <div className="ui-campo__separado">
          <SelectorPais id={`${id}-pais`} valor={pais} onCambio={onCambioPais} />
          {input}
        </div>
      ) : conPrefijoFijo ? (
        <div className={error ? "ui-campo__grupo ui-campo__grupo--error" : "ui-campo__grupo"}>
          <span className="ui-campo__prefijo" aria-hidden="true">
            {bandera ? <span className={`fi fi-${bandera} ui-campo__bandera`} /> : null}
            {prefijo}
          </span>
          {input}
        </div>
      ) : esClave ? (
        <div className="ui-campo__clave">
          {input}
          <button
            type="button"
            className="ui-campo__mostrar"
            aria-label={claveVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={claveVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={claveVisible}
            onClick={() => setClaveVisible((visible) => !visible)}
          >
            {claveVisible ? <IconoOjoTachado /> : <IconoOjo />}
          </button>
        </div>
      ) : (
        input
      )}
      {error ? (
        <p id={`${id}-error`} className="ui-campo__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
