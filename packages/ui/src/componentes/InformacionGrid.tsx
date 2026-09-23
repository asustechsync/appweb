import type { ReactNode } from "react";

import "./estilos/informacion-grid.css";

export interface Dato {
  titulo: string;
  contenido: ReactNode;
  icono?: ReactNode;
}

export interface PropsInformacionGrid {
  datos: Dato[];
}

/**
 * Grid de tarjetas de información para mostrar datos adicionales.
 */
export function InformacionGrid({ datos }: PropsInformacionGrid) {
  return (
    <div className="ui-informacion-grid">
      {datos.map((dato, idx) => (
        <div key={idx} className="ui-informacion-grid__tarjeta">
          <div className="ui-informacion-grid__cabecera">
            {dato.icono && <span className="ui-informacion-grid__icono">{dato.icono}</span>}
            <h3 className="ui-informacion-grid__titulo">{dato.titulo}</h3>
          </div>
          <div className="ui-informacion-grid__contenido">{dato.contenido}</div>
        </div>
      ))}
    </div>
  );
}
