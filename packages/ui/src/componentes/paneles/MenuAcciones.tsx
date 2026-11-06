"use client";

import { type ReactNode, useEffect, useRef } from "react";

import "./menu-acciones.css";

export interface AccionDeMenu {
  etiqueta: string;
  icono: ReactNode;
  onClick: () => void;
  /** Una accion que borra algo: sale en rojo. */
  peligro?: boolean;
  disabled?: boolean;
}

export interface PropsMenuAcciones {
  etiqueta: string;
  acciones: AccionDeMenu[];
}

/** Boton de tres puntos que abre una lista corta de acciones; se cierra al elegir o al pulsar fuera. */
export function MenuAcciones({ etiqueta, acciones }: PropsMenuAcciones) {
  const caja = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function alPulsar(evento: MouseEvent) {
      const elemento = caja.current;
      if (elemento?.open && !elemento.contains(evento.target as Node)) elemento.open = false;
    }
    document.addEventListener("mousedown", alPulsar);
    return () => document.removeEventListener("mousedown", alPulsar);
  }, []);

  return (
    <details ref={caja} className="ui-menu-acciones">
      <summary className="ui-menu-acciones__boton" aria-label={etiqueta} title={etiqueta}>
        <span className="ui-menu-acciones__punto" aria-hidden="true" />
        <span className="ui-menu-acciones__punto" aria-hidden="true" />
        <span className="ui-menu-acciones__punto" aria-hidden="true" />
      </summary>
      <div className="ui-menu-acciones__lista">
        {acciones.map((accion) => (
          <button
            key={accion.etiqueta}
            type="button"
            disabled={accion.disabled}
            className={
              accion.peligro
                ? "ui-menu-acciones__accion ui-menu-acciones__accion--peligro"
                : "ui-menu-acciones__accion"
            }
            onClick={() => {
              if (caja.current) caja.current.open = false;
              accion.onClick();
            }}
          >
            {accion.icono}
            {accion.etiqueta}
          </button>
        ))}
      </div>
    </details>
  );
}
