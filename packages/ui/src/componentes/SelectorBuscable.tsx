"use client";

import { useEffect, useRef, useState } from "react";

import { IconoFlechaAbajo } from "../iconos";

import "./estilos/selector-buscable.css";

export interface OpcionDeSelectorBuscable {
  valor: string;
  etiqueta: string;
}

export interface PropsSelectorBuscable {
  id?: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionDeSelectorBuscable[];
  onCambio: (valor: string) => void;
  disabled?: boolean | undefined;
  placeholder?: string;
}

/**
 * Disparador escribible: filtra `opciones` con lo que se tipea y muestra
 * hasta 4 a la vez, con scroll para el resto. Usado por `SelectorFecha` (dia,
 * mes, año) en vez de un <select> nativo, cuyo desplegable no se puede
 * limitar en alto.
 */
export function SelectorBuscable({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  disabled,
  placeholder,
}: PropsSelectorBuscable) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const contenedorRef = useRef<HTMLDivElement>(null);

  const elegida = opciones.find((opcion) => opcion.valor === valor);

  // Mientras esta cerrado, el input muestra lo elegido; al abrir/escribir
  // pasa a mostrar lo que la persona tipeo, para poder filtrar con eso.
  useEffect(() => {
    if (!abierto) setTexto("");
  }, [abierto]);

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

  const termino = texto.trim().toLowerCase();
  const visibles =
    termino === ""
      ? opciones
      : opciones.filter(
          (opcion) =>
            opcion.etiqueta.toLowerCase().includes(termino) || opcion.valor.startsWith(termino),
        );

  function elegir(opcion: OpcionDeSelectorBuscable) {
    onCambio(opcion.valor);
    setAbierto(false);
  }

  return (
    <div className="ui-selector-buscable" ref={contenedorRef}>
      <input
        id={id}
        type="text"
        className="ui-selector-buscable__disparador"
        disabled={disabled}
        placeholder={placeholder ?? etiqueta}
        role="combobox"
        aria-expanded={abierto}
        autoComplete="off"
        value={abierto ? texto : (elegida?.etiqueta ?? "")}
        onFocus={() => setAbierto(true)}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setAbierto(true);
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" && visibles[0]) {
            evento.preventDefault();
            elegir(visibles[0]);
          }
        }}
      />
      <IconoFlechaAbajo tamano={12} className="ui-selector-buscable__flecha" />

      {abierto ? (
        <ul
          className={
            visibles.length > 4
              ? "ui-selector-buscable__lista ui-selector-buscable__lista--con-scroll"
              : "ui-selector-buscable__lista"
          }
          role="listbox"
          aria-label={etiqueta}
        >
          {visibles.length === 0 ? (
            <li className="ui-selector-buscable__vacio-lista">Sin resultados</li>
          ) : (
            visibles.map((opcion) => (
              <li key={opcion.valor}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opcion.valor === valor}
                  className="ui-selector-buscable__opcion"
                  onClick={() => elegir(opcion)}
                >
                  {opcion.etiqueta}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
