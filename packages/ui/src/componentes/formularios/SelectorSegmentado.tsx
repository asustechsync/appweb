"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";

import "./selector-segmentado.css";

export interface OpcionSegmentada {
  valor: string;
  etiqueta: string;
}

export interface PropsSelectorSegmentado {
  /** Nombre del grupo para lectores de pantalla. */
  etiqueta: string;
  opciones: OpcionSegmentada[];
  /** Un valor que no esta en `opciones` deja el selector sin ninguna activa. */
  valor: string;
  onCambio: (valor: string) => void;
}

/**
 * Elegir un valor entre pocas opciones con una pildora que se desliza hasta
 * la elegida. Las opciones miden lo mismo: asi la pildora solo se traslada.
 * Teclado como un grupo de radios: las flechas mueven y eligen.
 */
export function SelectorSegmentado({
  etiqueta,
  opciones,
  valor,
  onCambio,
}: PropsSelectorSegmentado) {
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const indice = opciones.findIndex((opcion) => opcion.valor === valor);

  function alTeclear(evento: KeyboardEvent<HTMLButtonElement>, actual: number) {
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
    if (paso === undefined) return;
    evento.preventDefault();
    const siguiente = (actual + paso + opciones.length) % opciones.length;
    const opcion = opciones[siguiente];
    if (!opcion) return;
    onCambio(opcion.valor);
    botones.current[siguiente]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className="ui-selector-segmentado"
      style={{ "--segmentos": opciones.length, "--indice": indice } as CSSProperties}
    >
      {indice >= 0 ? <span className="ui-selector-segmentado__pildora" aria-hidden="true" /> : null}
      {opciones.map((opcion, i) => {
        const activa = i === indice;
        return (
          <button
            key={opcion.valor}
            ref={(nodo) => {
              botones.current[i] = nodo;
            }}
            type="button"
            role="radio"
            aria-checked={activa}
            // Un solo punto de tabulacion: la activa, o la primera si no hay.
            tabIndex={activa || (indice < 0 && i === 0) ? 0 : -1}
            className={
              activa
                ? "ui-selector-segmentado__opcion ui-selector-segmentado__opcion--activa"
                : "ui-selector-segmentado__opcion"
            }
            onClick={() => onCambio(opcion.valor)}
            onKeyDown={(evento) => alTeclear(evento, i)}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
