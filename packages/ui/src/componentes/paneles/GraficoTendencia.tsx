import { useId } from "react";

import { suavizar, trazo } from "./trazo-serie";
import "./grafico-tendencia.css";

export interface PropsGraficoTendencia {
  /** Valores acumulados del periodo actual; puede ser mas corta que `seriePrevia` (se corta en ahora). */
  serie: number[];
  /** El periodo anterior entero, en los mismos tramos: linea punteada detras. */
  seriePrevia?: number[];
  /** Titulo arriba a la izquierda: "Ventas". */
  titulo: string;
  /** La cifra grande bajo el titulo, ya formateada: "S/ 858.00". */
  valor: string;
  /** Al lado de la cifra, ya formateado: "+S/ 120.00 vs ayer". */
  detalle?: string;
  /** Color del detalle: verde si subio, rojo si bajo. */
  tono?: "sube" | "baja" | "igual";
  /** Leyenda de la linea punteada: "Ayer". */
  etiquetaPrevia?: string;
  /** Marcas del eje horizontal; `posicion` es la fraccion (0 a 1) del periodo entero. */
  marcas: { posicion: number; texto: string }[];
  /** Texto para lectores de pantalla: "Ventas acumuladas del periodo". */
  etiqueta: string;
}

const ANCHO = 640;
const ALTO = 160;
/** Aire arriba para que la linea no toque la cifra. */
const MARGEN = 12;

/**
 * Tendencia de un periodo: titulo y cifra grande arriba, la linea con su area
 * debajo de borde a borde de la tarjeta y las marcas del eje al pie. El periodo
 * anterior va detras, punteado.
 */
export function GraficoTendencia({
  serie,
  seriePrevia,
  titulo,
  valor,
  detalle,
  tono = "igual",
  etiquetaPrevia,
  marcas,
  etiqueta,
}: PropsGraficoTendencia) {
  const idDegradado = useId();
  const largo = Math.max(serie.length, seriePrevia?.length ?? 0);
  if (largo < 2 || serie.length === 0) return null;

  // Una sola escala para las dos lineas, arrancando en cero: asi la altura es
  // dinero y no solo forma.
  const tope = Math.max(...serie, ...(seriePrevia ?? []), 1);
  const x = (fraccion: number) => fraccion * ANCHO;
  const aPuntos = (valores: number[]) =>
    suavizar(valores).map((v, i): [number, number] => [
      x(i / (largo - 1)),
      ALTO - (v / tope) * (ALTO - MARGEN),
    ]);
  const puntos = aPuntos(serie);
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const linea = trazo(puntos);

  return (
    <figure className="ui-grafico-tendencia">
      <figcaption className="ui-grafico-tendencia__cabecera">
        <span className="ui-grafico-tendencia__fila">
          <span className="ui-grafico-tendencia__titulo">{titulo}</span>
          {seriePrevia && etiquetaPrevia ? (
            <span className="ui-grafico-tendencia__leyenda">
              <span className="ui-grafico-tendencia__clave" aria-hidden="true" />
              {etiquetaPrevia}
            </span>
          ) : null}
        </span>
        <span className="ui-grafico-tendencia__cifra">
          <span className="ui-grafico-tendencia__valor">{valor}</span>
          {detalle ? (
            <span
              className={`ui-grafico-tendencia__detalle ui-grafico-tendencia__detalle--${tono}`}
            >
              {detalle}
            </span>
          ) : null}
        </span>
      </figcaption>
      <svg
        className="ui-grafico-tendencia__lienzo"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={etiqueta}
      >
        <defs>
          {/* El area se apaga hacia abajo: fuerte bajo la linea, nada en el eje. */}
          <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {primero && ultimo && puntos.length > 1 ? (
          <path
            className="ui-grafico-tendencia__relleno"
            d={`${linea} L${ultimo[0]},${ALTO} L${primero[0]},${ALTO} Z`}
            fill={`url(#${idDegradado})`}
          />
        ) : null}
        {seriePrevia && seriePrevia.length > 1 ? (
          <path className="ui-grafico-tendencia__previa" d={trazo(aPuntos(seriePrevia))} />
        ) : null}
        {puntos.length > 1 ? <path className="ui-grafico-tendencia__linea" d={linea} /> : null}
      </svg>
      <div className="ui-grafico-tendencia__eje" aria-hidden="true">
        {marcas.map((marca) => (
          <span
            key={marca.texto}
            className={
              marca.posicion === 0
                ? "ui-grafico-tendencia__marca ui-grafico-tendencia__marca--inicio"
                : "ui-grafico-tendencia__marca"
            }
            style={{ left: `${marca.posicion * 100}%` }}
          >
            {marca.texto}
          </span>
        ))}
      </div>
    </figure>
  );
}
