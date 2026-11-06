"use client";

import { type CSSProperties, useEffect, useRef } from "react";

import type { OpcionMultiple } from "./SelectorMultiple";

import "./selector-multiple-desplegable.css";

export interface PropsSelectorMultipleDesplegable {
  etiqueta: string;
  opciones: OpcionMultiple[];
  /** Valores marcados, en cualquier orden. */
  valores: string[];
  onCambio: (valores: string[]) => void;
  /** Lo que dice el campo cuando no hay nada marcado. */
  vacio?: string;
  disabled?: boolean;
}

/** Cuantos nombres caben en el campo cerrado antes de resumir con "+N". */
const VISIBLES = 3;

/**
 * Como `SelectorMultiple`, pero cerrado en un campo: para listas largas
 * (los colores) que como pastillas ocuparian media pantalla. Se cierra al
 * pulsar fuera; devuelve los valores en el orden de `opciones`.
 */
export function SelectorMultipleDesplegable({
  etiqueta,
  opciones,
  valores,
  onCambio,
  vacio = "Elige…",
  disabled,
}: PropsSelectorMultipleDesplegable) {
  const caja = useRef<HTMLDetailsElement>(null);
  const marcados = new Set(valores);

  useEffect(() => {
    function alPulsar(evento: MouseEvent) {
      const elemento = caja.current;
      if (elemento?.open && !elemento.contains(evento.target as Node)) elemento.open = false;
    }
    document.addEventListener("mousedown", alPulsar);
    return () => document.removeEventListener("mousedown", alPulsar);
  }, []);

  function alternar(valor: string) {
    const siguiente = new Set(marcados);
    if (siguiente.has(valor)) siguiente.delete(valor);
    else siguiente.add(valor);
    onCambio(opciones.map((o) => o.valor).filter((v) => siguiente.has(v)));
  }

  const elegidas = opciones.filter((o) => marcados.has(o.valor));
  const resumen =
    elegidas.length === 0
      ? vacio
      : elegidas
          .slice(0, VISIBLES)
          .map((o) => o.etiqueta)
          .join(", ") + (elegidas.length > VISIBLES ? ` +${elegidas.length - VISIBLES}` : "");

  return (
    <div className="ui-selector-desplegable">
      <span className="ui-selector-desplegable__titulo">{etiqueta}</span>
      <details ref={caja} className="ui-selector-desplegable__caja">
        <summary
          className={
            elegidas.length === 0
              ? "ui-selector-desplegable__campo ui-selector-desplegable__campo--vacio"
              : "ui-selector-desplegable__campo"
          }
          aria-disabled={disabled || undefined}
        >
          <span className="ui-selector-desplegable__resumen">{resumen}</span>
        </summary>
        <fieldset className="ui-selector-desplegable__lista" aria-label={etiqueta}>
          {opciones.map((opcion) => {
            const activa = marcados.has(opcion.valor);
            return (
              <button
                key={opcion.valor}
                type="button"
                aria-pressed={activa}
                className={
                  activa
                    ? "ui-selector-desplegable__opcion ui-selector-desplegable__opcion--activa"
                    : "ui-selector-desplegable__opcion"
                }
                onClick={() => alternar(opcion.valor)}
              >
                <span className="ui-selector-desplegable__marca" aria-hidden="true" />
                {opcion.muestra ? (
                  <span
                    className="ui-selector-desplegable__muestra"
                    style={{ "--muestra": opcion.muestra } as CSSProperties}
                    aria-hidden="true"
                  />
                ) : null}
                {opcion.etiqueta}
              </button>
            );
          })}
        </fieldset>
      </details>
    </div>
  );
}
