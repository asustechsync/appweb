import type { ReactNode } from "react";

import "./fila-movimiento.css";

export type TonoMovimiento = "exito" | "alerta" | "error" | "neutro";

export interface PropsFilaMovimiento {
  /** El logo o icono a la izquierda: el medio de pago. */
  logo: ReactNode;
  /** Linea principal: "261023-0009". */
  titulo: string;
  /** Al lado del titulo, en suave: el cliente. */
  detalle?: string;
  /** Segunda linea, corta: medio y fecha. */
  subtitulo?: ReactNode;
  /** Estado como punto de color y texto, en su propia columna. */
  estado?: { texto: string; tono: TonoMovimiento };
  /** El monto ya formateado, alineado a la derecha. */
  valor: string;
  /** Una accion destacada (Revisar). Sin ella, la fila entera abre `onAbrir`. */
  accion?: ReactNode;
  /** Toda la fila es clicable: abre el detalle. */
  onAbrir?: () => void;
  /** Nombre accesible del clic en la fila: "Ver pedido 261023-0009". */
  etiquetaAbrir?: string;
  /** La fila elegida: se marca para que la vista previa de al lado se entienda. */
  seleccionada?: boolean;
}

/**
 * Un movimiento de dinero en un listado: logo, quien y cuando, estado, monto.
 *
 * Columnas fijas para que estado y monto queden alineados fila contra fila.
 * La fila entera abre el detalle; solo lo que pide accion lleva boton.
 * En movil estado, monto y accion bajan a una segunda linea.
 */
export function FilaMovimiento({
  logo,
  titulo,
  detalle,
  subtitulo,
  estado,
  valor,
  accion,
  onAbrir,
  etiquetaAbrir,
  seleccionada = false,
}: PropsFilaMovimiento) {
  const clases = ["ui-fila-movimiento"];
  if (onAbrir) clases.push("ui-fila-movimiento--clicable");
  if (seleccionada) clases.push("ui-fila-movimiento--seleccionada");
  return (
    <article className={clases.join(" ")}>
      {onAbrir ? (
        // Boton que cubre la fila: la accion queda encima y sigue siendo su propio boton.
        <button
          type="button"
          className="ui-fila-movimiento__abrir"
          onClick={onAbrir}
          aria-label={etiquetaAbrir ?? titulo}
        />
      ) : null}
      <div className="ui-fila-movimiento__logo">{logo}</div>
      <div className="ui-fila-movimiento__texto">
        <p className="ui-fila-movimiento__titulo">
          {titulo}
          {detalle ? <span className="ui-fila-movimiento__detalle"> · {detalle}</span> : null}
        </p>
        {subtitulo ? <p className="ui-fila-movimiento__subtitulo">{subtitulo}</p> : null}
      </div>
      <div className="ui-fila-movimiento__cierre">
        <span className="ui-fila-movimiento__estado">
          {estado ? (
            <>
              <span
                className={`ui-fila-movimiento__punto ui-fila-movimiento__punto--${estado.tono}`}
                aria-hidden="true"
              />
              {estado.texto}
            </>
          ) : null}
        </span>
        <span className="ui-fila-movimiento__valor">{valor}</span>
        <span className="ui-fila-movimiento__accion">{accion}</span>
      </div>
    </article>
  );
}
