"use client";

import "./interruptor-panel.css";

export interface PropsInterruptorPanel {
  etiqueta: string;
  marcada: boolean;
  onCambio: (marcada: boolean) => void;
  disabled?: boolean;
  /** Por que no se puede encender; sale como ayuda al pasar el cursor. */
  motivo?: string;
}

/** Interruptor con su etiqueta, del alto de los botones de una barra de acciones. */
export function InterruptorPanel({
  etiqueta,
  marcada,
  onCambio,
  disabled,
  motivo,
}: PropsInterruptorPanel) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={marcada}
      disabled={disabled}
      title={disabled ? motivo : undefined}
      className={
        marcada ? "ui-interruptor-panel ui-interruptor-panel--activo" : "ui-interruptor-panel"
      }
      onClick={() => onCambio(!marcada)}
    >
      <span className="ui-interruptor-panel__pista" aria-hidden="true">
        <span className="ui-interruptor-panel__perilla" />
      </span>
      {etiqueta}
    </button>
  );
}
