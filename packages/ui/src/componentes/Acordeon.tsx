import type { ReactNode } from "react";

import { IconoFlechaAbajo } from "../iconos";

import "./primitivos.css";

export interface SeccionDeAcordeon {
  titulo: string;
  contenido: ReactNode;
}

export interface PropsAcordeon {
  secciones: SeccionDeAcordeon[];
}

/**
 * Lista de secciones plegables (guia de tallas, envio, pagos...).
 *
 * Cada seccion es un <details>: abre y cierra sin JavaScript, asi que sirve
 * dentro del HTML estatico de Clase A. El contenido llega ya escrito; aqui
 * solo se le da forma.
 */
export function Acordeon({ secciones }: PropsAcordeon) {
  if (secciones.length === 0) return null;

  return (
    <div className="ui-acordeon">
      {secciones.map((seccion) => (
        <details key={seccion.titulo} className="ui-acordeon__seccion">
          <summary className="ui-acordeon__titulo">
            <span>{seccion.titulo}</span>
            <IconoFlechaAbajo tamano={16} className="ui-acordeon__flecha" />
          </summary>
          <div className="ui-acordeon__contenido">{seccion.contenido}</div>
        </details>
      ))}
    </div>
  );
}
