"use client";

import "./estilos/pestanas.css";

export interface OpcionDePestana {
  id: string;
  etiqueta: string;
}

export interface PropsPestanas {
  etiqueta: string;
  opciones: OpcionDePestana[];
  activa: string;
  onCambio: (id: string) => void;
}

/**
 * Pestañas horizontales para repartir un mismo bloque en varias vistas.
 * Solo pinta la barra: quien la usa decide que mostrar debajo segun `activa`.
 */
export function Pestanas({ etiqueta, opciones, activa, onCambio }: PropsPestanas) {
  return (
    <div className="ui-pestanas" role="tablist" aria-label={etiqueta}>
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          role="tab"
          aria-selected={opcion.id === activa}
          className={opcion.id === activa ? "ui-pestanas__pestana ui-pestanas__pestana--activa" : "ui-pestanas__pestana"}
          onClick={() => onCambio(opcion.id)}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}
