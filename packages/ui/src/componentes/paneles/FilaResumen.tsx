import type { ReactNode } from "react";

import type { TonoMovimiento } from "./FilaMovimiento";

import "./fila-resumen.css";

export interface PropsFilaResumen {
  /** Icono o inicial en el cuadro de la izquierda. */
  marca: ReactNode;
  titulo: string;
  /** Segunda linea, corta: la fecha o el detalle. */
  subtitulo?: string;
  /** A la derecha: estado con punto de color. */
  estado?: { texto: string; tono: TonoMovimiento };
  /** Con esto la fila entera es un boton que lo abre. */
  onAbrir?: () => void;
}

/** Una fila pequena del inicio: burbuja gris sin borde, dos lineas y un estado. Va dentro de `ListaActividad`. */
export function FilaResumen({ marca, titulo, subtitulo, estado, onAbrir }: PropsFilaResumen) {
  const contenido = (
    <>
      <span className="ui-fila-resumen__marca">{marca}</span>
      <span className="ui-fila-resumen__texto">
        <span className="ui-fila-resumen__titulo">{titulo}</span>
        {subtitulo ? <span className="ui-fila-resumen__subtitulo">{subtitulo}</span> : null}
      </span>
      {estado ? (
        <span className="ui-fila-resumen__estado">
          <span
            className={`ui-fila-resumen__punto ui-fila-resumen__punto--${estado.tono}`}
            aria-hidden="true"
          />
          {estado.texto}
        </span>
      ) : null}
    </>
  );
  return (
    <li>
      {onAbrir ? (
        <button
          type="button"
          className="ui-fila-resumen ui-fila-resumen--clicable"
          onClick={onAbrir}
        >
          {contenido}
        </button>
      ) : (
        <div className="ui-fila-resumen">{contenido}</div>
      )}
    </li>
  );
}
