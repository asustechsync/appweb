"use client";

import { useId, useRef, useState } from "react";

import { IconoFlechaAbajo, IconoMarcar } from "../../iconos";
import { useCierreDesplegable } from "./useCierreDesplegable";

import "../estilos.css";
import "./selector-etiquetas.css";

export interface PropsSelectorEtiquetas {
  id: string;
  etiqueta: string;
  /** Las etiquetas que se ofrecen, en el orden de la lista. */
  opciones: string[];
  /** Las elegidas, en el orden en que se eligieron: la primera es la principal. */
  valores: string[];
  onCambio: (valores: string[]) => void;
  /** Cuantas se pueden elegir a la vez. */
  maximo?: number;
  disabled?: boolean;
}

/** "Nuevo", "Oferta" y "Top" tienen su color en la tienda; las demas salen en gris. */
function tonoDe(nombre: string): "nuevo" | "oferta" | "top" | "neutro" {
  const clave = nombre.trim().toLowerCase();
  if (clave === "nuevo") return "nuevo";
  if (clave === "oferta") return "oferta";
  if (clave === "top" || clave === "tendencia") return "top";
  return "neutro";
}

/** "Más vendido" -> "MV"; una sola palabra, sus dos primeras letras: "Oferta" -> "OF". */
function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/);
  const letras =
    palabras.length > 1 ? palabras.slice(0, 2).map((p) => p.charAt(0)).join("") : nombre.trim().slice(0, 2);
  return letras.toUpperCase();
}

function Pastilla({ nombre, corta = false }: { nombre: string; corta?: boolean }) {
  return (
    <span
      className={`ui-selector-etiquetas__pastilla ui-selector-etiquetas__pastilla--${tonoDe(nombre)}`}
      {...(corta ? { title: nombre } : {})}
    >
      {corta ? iniciales(nombre) : nombre}
    </span>
  );
}

/**
 * Desplegable de seleccion multiple para las etiquetas de un producto: cada
 * opcion se ve como saldra en la tienda y la elegida lleva un check. Se queda
 * abierto mientras se eligen varias; se cierra al pulsar fuera o con Escape.
 */
export function SelectorEtiquetas({
  id,
  etiqueta,
  opciones,
  valores,
  onCambio,
  maximo = 4,
  disabled,
}: PropsSelectorEtiquetas) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const listaId = `${useId()}-opciones`;

  useCierreDesplegable(abierto, contenedorRef, setAbierto);

  function alternar(nombre: string) {
    if (valores.includes(nombre)) onCambio(valores.filter((v) => v !== nombre));
    else if (valores.length < maximo) onCambio([...valores, nombre]);
  }

  return (
    <div className="ui-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <div className="ui-selector-etiquetas" ref={contenedorRef}>
        <button
          type="button"
          id={id}
          className="ui-selector-etiquetas__disparador"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={abierto}
          aria-controls={listaId}
          onClick={() => setAbierto((v) => !v)}
        >
          <span className="ui-selector-etiquetas__elegidas">
            {valores.length === 0 ? (
              <span className="ui-selector-etiquetas__vacio">Ninguna</span>
            ) : (
              valores.map((v) => <Pastilla key={v} nombre={v} corta />)
            )}
          </span>
          <IconoFlechaAbajo tamano={16} />
        </button>
        {abierto ? (
          <ul
            id={listaId}
            className="ui-selector-etiquetas__lista"
            role="listbox"
            aria-multiselectable="true"
            aria-label={etiqueta}
          >
            {opciones.map((nombre) => {
              const marcada = valores.includes(nombre);
              const lleno = !marcada && valores.length >= maximo;
              return (
                <li key={nombre} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={marcada}
                    disabled={lleno}
                    className="ui-selector-etiquetas__opcion"
                    onClick={() => alternar(nombre)}
                  >
                    <span className="ui-selector-etiquetas__casilla" aria-hidden="true">
                      {marcada ? <IconoMarcar tamano={12} /> : null}
                    </span>
                    <Pastilla nombre={nombre} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
