"use client";

import { AyudaCampo } from "./AyudaCampo";

import "./interruptor-campo.css";

export interface PropsInterruptorCampo {
  etiqueta: string;
  /** Una linea que dice que cambia al encenderlo. */
  descripcion?: string;
  /** Lo mismo, pero en una interrogante junto al nombre: no gasta una linea. */
  ayuda?: string;
  marcada: boolean;
  onCambio: (marcada: boolean) => void;
  disabled?: boolean;
}

/** Opcion de si o no dentro de un formulario: texto a la izquierda, deslizable a la derecha. */
export function InterruptorCampo({
  etiqueta,
  descripcion,
  ayuda,
  marcada,
  onCambio,
  disabled,
}: PropsInterruptorCampo) {
  return (
    <div className="ui-interruptor-campo-fila">
      <span className="ui-interruptor-campo__texto">
        <span className="ui-interruptor-campo__etiqueta">
          {etiqueta}
          {ayuda ? <AyudaCampo texto={ayuda} /> : null}
        </span>
        {descripcion ? <span className="ui-interruptor-campo__descripcion">{descripcion}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={marcada}
        aria-label={etiqueta}
        disabled={disabled}
        className={
          marcada ? "ui-interruptor-campo ui-interruptor-campo--activo" : "ui-interruptor-campo"
        }
        onClick={() => onCambio(!marcada)}
      >
        <span className="ui-interruptor-campo__pista" aria-hidden="true">
          <span className="ui-interruptor-campo__perilla" />
        </span>
      </button>
    </div>
  );
}
