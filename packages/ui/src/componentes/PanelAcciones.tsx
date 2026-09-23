import type { ReactNode } from "react";

import "./estilos/panel-acciones.css";

export interface PropsPanelAcciones {
  titulo?: string;
  descripcion?: string;
  acciones: Array<{
    etiqueta: string;
    icono?: ReactNode;
    primaria?: boolean;
  }>;
  contenido?: ReactNode;
}

/**
 * Panel derecho con título, descripción y botones de acciones.
 */
export function PanelAcciones({ titulo, descripcion, acciones, contenido }: PropsPanelAcciones) {
  return (
    <div className="ui-panel-acciones">
      {(titulo || descripcion) && (
        <div className="ui-panel-acciones__cabecera">
          {titulo && <h2 className="ui-panel-acciones__titulo">{titulo}</h2>}
          {descripcion && <p className="ui-panel-acciones__descripcion">{descripcion}</p>}
        </div>
      )}

      <div className="ui-panel-acciones__acciones">
        {acciones.map((accion, idx) => (
          <button
            key={idx}
            className={`ui-panel-acciones__boton ${accion.primaria ? "ui-panel-acciones__boton--primaria" : ""}`}
          >
            {accion.icono && <span className="ui-panel-acciones__icono">{accion.icono}</span>}
            <span>{accion.etiqueta}</span>
          </button>
        ))}
      </div>

      {contenido && <div className="ui-panel-acciones__contenido">{contenido}</div>}
    </div>
  );
}
