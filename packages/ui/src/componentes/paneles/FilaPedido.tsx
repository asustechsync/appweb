import type { ReactNode } from "react";

import type { TonoMovimiento } from "./FilaMovimiento";

import "./fila-pedido.css";

export interface PropsFilaPedido {
  /** La miniatura a la izquierda: la foto del primer producto. */
  logo: ReactNode;
  /** Linea principal: "261023-0009". */
  titulo: string;
  /** Al lado del titulo, en suave: el cliente. */
  detalle?: string;
  /** Segunda linea de la izquierda: contenido del pedido. */
  contenido: string;
  /** Bloque del centro, dos lineas: el dia y la hora. */
  centro: [string, string];
  estado: { texto: string; tono: TonoMovimiento };
  /** Barra de avance de la entrega; la primera casilla vacia es el paso que se espera. Sin ella (cancelado) no se pinta. */
  avance?: { hechos: number; total: number };
  /** Linea corta bajo el estado, en lugar de la barra de avance: la fecha del ultimo paso. */
  nota?: string;
  seleccionada?: boolean;
  onAbrir: () => void;
  etiquetaAbrir: string;
}

/**
 * Un pedido en el listado, sin montos ni datos de contacto: miniatura, dos
 * lineas a la izquierda (quien y que), el dia y la hora al centro, y a la
 * derecha el estado con su avance. La fila entera abre el pedido. En movil el
 * centro se oculta.
 */
export function FilaPedido({
  logo,
  titulo,
  detalle,
  contenido,
  centro,
  estado,
  avance,
  nota,
  seleccionada = false,
  onAbrir,
  etiquetaAbrir,
}: PropsFilaPedido) {
  const clases = ["ui-fila-pedido"];
  if (seleccionada) clases.push("ui-fila-pedido--seleccionada");
  return (
    <article className={clases.join(" ")}>
      <button
        type="button"
        className="ui-fila-pedido__abrir"
        onClick={onAbrir}
        aria-label={etiquetaAbrir}
      />
      <div className="ui-fila-pedido__logo">{logo}</div>
      <div className="ui-fila-pedido__bloque">
        <p className="ui-fila-pedido__linea ui-fila-pedido__linea--titulo">
          {titulo}
          {detalle ? <span className="ui-fila-pedido__detalle"> · {detalle}</span> : null}
        </p>
        <p className="ui-fila-pedido__linea">{contenido}</p>
      </div>
      <div className="ui-fila-pedido__bloque ui-fila-pedido__centro">
        {centro.map((dato, i) => (
          <p
            key={dato}
            className={`ui-fila-pedido__linea${i === 0 ? " ui-fila-pedido__linea--titulo" : ""}`}
          >
            {dato}
          </p>
        ))}
      </div>
      <div className="ui-fila-pedido__bloque ui-fila-pedido__derecha">
        <p className="ui-fila-pedido__linea ui-fila-pedido__linea--titulo">
          <span
            className={`ui-fila-movimiento__punto ui-fila-movimiento__punto--${estado.tono}`}
            aria-hidden="true"
          />{" "}
          {estado.texto}
        </p>
        {avance ? (
          <div className="ui-fila-pedido__avance" aria-hidden="true">
            {Array.from({ length: avance.total }, (_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: los pasos son fijos y sin identidad propia
                key={i}
                className={`ui-fila-pedido__paso${
                  i < avance.hechos
                    ? " ui-fila-pedido__paso--hecho"
                    : i === avance.hechos
                      ? " ui-fila-pedido__paso--espera"
                      : ""
                }`}
              />
            ))}
          </div>
        ) : null}
        {nota ? <p className="ui-fila-pedido__linea">{nota}</p> : null}
      </div>
    </article>
  );
}
