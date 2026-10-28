import { InsigniaNivel, type TonoNivel } from "./EscaleraNiveles";

import "./fila-ranking.css";

export interface PropsFilaRanking {
  /** La inicial del cliente, en el cuadro de la izquierda. */
  inicial: string;
  nombre: string;
  /** El nivel del cliente: su nombre y el tono que lo colorea. */
  nivel: { nombre: string; tono: TonoNivel };
  /** Avance hacia el siguiente nivel, de 0 a 100. */
  progreso: number;
  /** Lo comprado, junto a la etiqueta del nivel: "S/ 926.90" o "12 pedidos". */
  cifra: string;
  /** Al lado de la barra: lo que falta para el siguiente nivel, o "nivel máximo". */
  falta: string;
  /** Con esto la fila entera es un boton que lo abre. */
  onAbrir?: () => void;
}

/**
 * Una fila del ranking de clientes, en dos lineas: nombre, cifra y etiqueta del
 * nivel arriba; la barra de avance al siguiente y lo que falta debajo. Va
 * dentro de `ListaActividad`.
 */
export function FilaRanking({
  inicial,
  nombre,
  nivel,
  progreso,
  cifra,
  falta,
  onAbrir,
}: PropsFilaRanking) {
  const avance = Math.min(100, Math.max(0, Math.round(progreso)));
  const clase = "ui-fila-ranking";
  const contenido = (
    <>
      <span className="ui-fila-ranking__marca" aria-hidden="true">
        {inicial}
      </span>
      <span className="ui-fila-ranking__texto">
        <span className="ui-fila-ranking__cabecera">
          <span className="ui-fila-ranking__nombre">{nombre}</span>
          <span className="ui-fila-ranking__cifra">{cifra}</span>
          <InsigniaNivel tono={nivel.tono}>{nivel.nombre}</InsigniaNivel>
        </span>
        <span className="ui-fila-ranking__avance-fila">
          <span
            className="ui-fila-ranking__barra"
            role="progressbar"
            aria-label={`Avance hacia el siguiente nivel de ${nombre}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={avance}
          >
            <span
              className={`ui-fila-ranking__avance ui-progreso-nivel__avance--${nivel.tono}`}
              style={{ inlineSize: `${avance}%` }}
            />
          </span>
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
