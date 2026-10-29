import { IconoCoronaRellena } from "../../iconos";
import { InsigniaNivel, type TonoNivel } from "./EscaleraNiveles";

import "./fila-ranking.css";

export interface PropsFilaRanking {
  /** El puesto en el ranking, desde 1: va en el cuadro de la izquierda. */
  puesto: number;
  nombre: string;
  /** El nivel del cliente: su nombre y el tono que lo colorea. */
  nivel: { nombre: string; tono: TonoNivel };
  /** Lo comprado, junto a la etiqueta del nivel: "S/ 926.90" o "12 pedidos". */
  cifra: string;
  /** Lo que falta para el siguiente nivel, o "nivel máximo": va a la derecha de la etiqueta del nivel. */
  falta: string;
  /** Con esto la fila entera es un boton que lo abre. */
  onAbrir?: () => void;
}

/**
 * Una fila del ranking de clientes, en dos lineas: puesto, nombre y cifra arriba;
 * la etiqueta del nivel y lo que falta para el siguiente debajo. Va dentro de `ListaActividad`.
 */
export function FilaRanking({ puesto, nombre, nivel, cifra, falta, onAbrir }: PropsFilaRanking) {
  const clase = "ui-fila-ranking";
  const contenido = (
    <>
      <span
        className={`ui-fila-ranking__marca ui-insignia-nivel--${nivel.tono}`}
        aria-label={`Puesto ${puesto}`}
      >
        {puesto}
      </span>
      <span className="ui-fila-ranking__texto">
        <span className="ui-fila-ranking__cabecera">
          <span className="ui-fila-ranking__nombre">{nombre}</span>
          <span className="ui-fila-ranking__cifra">{cifra}</span>
        </span>
        <span className="ui-fila-ranking__avance-fila">
          <InsigniaNivel tono={nivel.tono}>{nivel.nombre}</InsigniaNivel>
          {puesto === 1 ? (
            <span className="ui-fila-ranking__corona" role="img" aria-label="Primer puesto">
              <IconoCoronaRellena tamano={14} />
            </span>
          ) : null}
          <span className="ui-fila-ranking__falta">{falta}</span>
        </span>
      </span>
    </>
  );
  return (
    <li>
      {onAbrir ? (
        <button type="button" className={`${clase} ui-fila-ranking--clicable`} onClick={onAbrir}>
          {contenido}
        </button>
      ) : (
        <div className={clase}>{contenido}</div>
      )}
    </li>
  );
}
