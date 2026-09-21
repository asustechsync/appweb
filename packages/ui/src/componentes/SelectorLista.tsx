"use client";

import { useEffect, useRef, useState } from "react";

import { IconoFlechaAbajo } from "../iconos";

import "./estilos/selector-lista.css";

export interface OpcionDeSelectorLista {
  valor: string;
  etiqueta: string;
}

export interface PropsSelectorLista {
  id?: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionDeSelectorLista[];
  onCambio: (valor: string) => void;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
}

/**
 * Como `SelectorBuscable`, pero sin escribir: un boton que abre el panel con
 * las opciones (hasta 4 a la vez, scroll para el resto) y se elige con clic.
 * Para listas cortas donde escribir no aporta nada (genero, tipo de documento).
 */
export function SelectorLista({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  disabled,
  placeholder,
}: PropsSelectorLista) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  const elegida = opciones.find((opcion) => opcion.valor === valor);

  function elegir(opcion: OpcionDeSelectorLista) {
    onCambio(opcion.valor);
    setAbierto(false);
  }

  return (
    <div className="ui-selector-lista" ref={contenedorRef}>
      <button
        type="button"
        id={id}
        className="ui-selector-lista__disparador"
        disabled={disabled}
        aria-expanded={abierto}
        onClick={() => setAbierto((valorPrevio) => !valorPrevio)}
      >
        <span className={elegida ? undefined : "ui-selector-lista__vacio"}>
          {elegida?.etiqueta ?? (placeholder ?? etiqueta)}
        </span>
        <IconoFlechaAbajo tamano={12} />
      </button>

      {abierto ? (
        <ul
          className={
            opciones.length > 4
              ? "ui-selector-lista__lista ui-selector-lista__lista--con-scroll"
              : "ui-selector-lista__lista"
          }
          role="listbox"
          aria-label={etiqueta}
        >
          {opciones.map((opcion) => (
            <li key={opcion.valor}>
              <button
                type="button"
                role="option"
                aria-selected={opcion.valor === valor}
                className="ui-selector-lista__opcion"
                onClick={() => elegir(opcion)}
              >
                {opcion.etiqueta}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
