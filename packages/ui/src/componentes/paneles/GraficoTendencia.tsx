"use client";

import { type PointerEvent, useId, useState } from "react";

import { suavizar, trazo } from "./trazo-serie";
import "./grafico-tendencia.css";

export interface PropsGraficoTendencia {
  /** Valores acumulados del periodo actual; puede ser mas corta que `seriePrevia` (se corta en ahora). */
  serie: number[];
  /** El periodo anterior entero, en los mismos tramos: linea punteada detras. */
  seriePrevia?: number[];
  /** Titulo arriba a la izquierda: "Ventas". */
  titulo: string;
  /** Nombre del periodo actual junto a su cifra: "Hoy", "Esta semana". */
  etiquetaActual: string;
  /** La cifra del periodo actual, ya formateada: "S/ 858.00". */
  valor: string;
  /** Cambio porcentual junto a la cifra, ya formateado: "+17%". */
  cambio?: string;
  /** Frase bajo el titulo, ya formateada: "+S/ 120.00 vs ayer". */
  detalle?: string;
  /** Color del cambio y la frase: verde si subio, rojo si bajo. */
  tono?: "sube" | "baja" | "igual";
  /** Otra linea suave bajo la frase: "Ultima venta hace 2 h". */
  nota?: string;
  /** La cifra del periodo anterior en el mismo punto, ya formateada: "S/ 562.55". */
  valorPrevio?: string;
  /** Leyenda de la linea punteada: "Ayer". */
  etiquetaPrevia?: string;
  /**
   * Cifras propias de la cabecera en lugar del valor actual y el previo, para
   * no repetir lo que ya dice otra tarjeta: "Ganancia", "Margen". Con ellas,
   * las dos series quedan como leyenda bajo el titulo.
   */
  cifras?: { etiqueta: string; valor: string; tono?: "sube" | "baja" | "igual" }[];
  /** Marcas del eje horizontal; `posicion` es la fraccion (0 a 1) del periodo entero. */
  marcas: { posicion: number; texto: string }[];
  /** Texto para lectores de pantalla: "Ventas acumuladas del periodo". */
  etiqueta: string;
  /** Como se llama cada punto de la serie ("7 p. m.", "22 oct"): el titulo del tooltip y la pildora del eje. */
  etiquetasPunto?: string[];
  /** Un monto como lo lee la persona: "S/ 658.09". */
  formatear: (valor: number) => string;
  /** Los numeros del eje vertical; por defecto, compactos: 500, 1k. */
  formatearEje?: (valor: number) => string;
}

const ANCHO = 640;
const ALTO = 160;
/** Aire arriba para que la linea no toque el borde. */
const MARGEN = 12;

function compacto(valor: number): string {
  if (valor >= 1000) return `${Math.round(valor / 100) / 10}k`;
  return String(Math.round(valor * 10) / 10);
}

/** Cuatro marcas redondas (0, 250, 500, 750) que cubren el tope: el eje vertical. */
function marcasVerticales(tope: number): number[] {
  const bruto = tope / 3;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const fraccion = bruto / potencia;
  const factor =
    fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 2.5 ? 2.5 : fraccion <= 5 ? 5 : 10;
  const paso = factor * potencia;
  const cantidad = Math.max(1, Math.ceil(tope / paso));
  return Array.from({ length: cantidad + 1 }, (_, i) => i * paso);
}

/**
 * Tendencia de un periodo: titulo y las dos cifras (periodo actual y anterior)
 * arriba, la linea con su eje vertical y rejilla punteada, y las marcas del
 * eje horizontal al pie. Al pasar el cursor (o tocar) marca el mismo punto en
 * las dos lineas, con su tooltip y la etiqueta en el eje; en reposo marca el
 * ultimo punto.
 */
export function GraficoTendencia({
  serie,
  seriePrevia,
  titulo,
  etiquetaActual,
  valor,
  cambio,
  detalle,
  tono = "igual",
  nota,
  valorPrevio,
  etiquetaPrevia,
  cifras,
  marcas,
  etiqueta,
  etiquetasPunto,
  formatear,
  formatearEje = compacto,
}: PropsGraficoTendencia) {
  const idDegradado = useId();
  // El punto que se explora y si el cursor esta encima: al salir, el tooltip
  // se desvanece donde estaba en lugar de saltar al ultimo punto.
  const [activo, setActivo] = useState<number | null>(null);
  const [explorando, setExplorando] = useState(false);
  const largo = Math.max(serie.length, seriePrevia?.length ?? 0);
  if (largo < 2 || serie.length === 0) return null;

  // Una sola escala para las dos lineas, arrancando en cero: asi la altura es
  // dinero y no solo forma. El eje llega a una marca redonda sobre el tope.
  const tope = Math.max(...serie, ...(seriePrevia ?? []), 1);
  const rejilla = marcasVerticales(tope);
  const maximo = rejilla[rejilla.length - 1] ?? tope;
  const y = (v: number) => ALTO - (v / maximo) * (ALTO - MARGEN);
  const aPuntos = (valores: number[]) =>
    suavizar(valores).map((v, i): [number, number] => [(i / (largo - 1)) * ANCHO, y(v)]);
  const puntos = aPuntos(serie);
  const puntosPrevios = seriePrevia ? aPuntos(seriePrevia) : [];
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const linea = trazo(puntos);

  const indice = Math.min(activo ?? serie.length - 1, serie.length - 1);
  const fraccion = indice / (largo - 1);
  const punto = puntos[indice];
  const puntoPrevio = puntosPrevios[indice];
  const valorActivo = serie[indice] ?? 0;
  const valorPrevioActivo = seriePrevia?.[indice];
  const nombreActivo = etiquetasPunto?.[indice];
  const hacia = fraccion > 0.55 ? "izquierda" : "derecha";
  // El punto lleno sigue al cursor; en reposo marca el ultimo valor.
  const indicePrincipal = explorando ? indice : serie.length - 1;
  const principal = puntos[indicePrincipal];
  const fraccionPrincipal = indicePrincipal / (largo - 1);

  function mover(evento: PointerEvent<HTMLDivElement>) {
    const caja = evento.currentTarget.getBoundingClientRect();
    if (caja.width <= 0) return;
    const f = (evento.clientX - caja.left) / caja.width;
    setActivo(Math.max(0, Math.min(serie.length - 1, Math.round(f * (largo - 1)))));
    setExplorando(true);
  }

  const pct = (v: number) => `${(v / ALTO) * 100}%`;

  return (
    <figure
      className={
        explorando
          ? "ui-grafico-tendencia ui-grafico-tendencia--explorando"
          : "ui-grafico-tendencia"
      }
    >
      <figcaption className="ui-grafico-tendencia__cabecera">
        <span className="ui-grafico-tendencia__titulos">
          <span className="ui-grafico-tendencia__titulo">{titulo}</span>
          {detalle ? (
            <span
              className={`ui-grafico-tendencia__detalle ui-grafico-tendencia__detalle--${tono}`}
            >
              {detalle}
            </span>
          ) : null}
          {nota ? <span className="ui-grafico-tendencia__nota">{nota}</span> : null}
          {cifras ? (
            <span className="ui-grafico-tendencia__leyenda">
              <span className="ui-grafico-tendencia__rotulo">
                <span className="ui-grafico-tendencia__marca-serie" aria-hidden="true" />
                {etiquetaActual}
              </span>
              {etiquetaPrevia && seriePrevia ? (
                <span className="ui-grafico-tendencia__rotulo">
                  <span
                    className="ui-grafico-tendencia__marca-serie ui-grafico-tendencia__marca-serie--previa"
                    aria-hidden="true"
                  />
                  {etiquetaPrevia}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
        {cifras ? (
          <span className="ui-grafico-tendencia__cifras">
            {cifras.map((cifra) => (
              <span key={cifra.etiqueta} className="ui-grafico-tendencia__cifra">
                <span className="ui-grafico-tendencia__rotulo">{cifra.etiqueta}</span>
                <span
                  className={`ui-grafico-tendencia__valor ui-grafico-tendencia__valor--${cifra.tono ?? "igual"}`}
                >
                  {cifra.valor}
                </span>
              </span>
            ))}
          </span>
        ) : (
          <span className="ui-grafico-tendencia__cifras">
            <span className="ui-grafico-tendencia__cifra">
              <span className="ui-grafico-tendencia__rotulo">
                <span className="ui-grafico-tendencia__marca-serie" aria-hidden="true" />
                {etiquetaActual}
              </span>
              <span className="ui-grafico-tendencia__valor">
                {valor}
                {cambio ? (
                  <span
                    className={`ui-grafico-tendencia__cambio ui-grafico-tendencia__cambio--${tono}`}
                  >
                    {cambio}
                  </span>
                ) : null}
              </span>
            </span>
            {valorPrevio && etiquetaPrevia ? (
              <span className="ui-grafico-tendencia__cifra ui-grafico-tendencia__cifra--previa">
                <span className="ui-grafico-tendencia__rotulo">
                  <span
                    className="ui-grafico-tendencia__marca-serie ui-grafico-tendencia__marca-serie--previa"
                    aria-hidden="true"
                  />
                  {etiquetaPrevia}
                </span>
                <span className="ui-grafico-tendencia__valor">{valorPrevio}</span>
              </span>
            ) : null}
          </span>
        )}
      </figcaption>

      <div className="ui-grafico-tendencia__cuerpo">
        <div className="ui-grafico-tendencia__escala" aria-hidden="true">
          {rejilla.map((marca) => (
            <span
              key={marca}
              className="ui-grafico-tendencia__valor-eje"
              style={{ top: pct(y(marca)) }}
            >
              {formatearEje(marca)}
            </span>
          ))}
        </div>
        <div className="ui-grafico-tendencia__grafico">
          <div
            className="ui-grafico-tendencia__area"
            onPointerMove={mover}
            onPointerDown={mover}
            onPointerLeave={() => setExplorando(false)}
          >
            {rejilla.map((marca) => (
              <span
                key={marca}
                className="ui-grafico-tendencia__rejilla"
                style={{ top: pct(y(marca)) }}
                aria-hidden="true"
              />
            ))}
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
              {puntosPrevios.length > 1 ? (
                <path className="ui-grafico-tendencia__previa" d={trazo(puntosPrevios)} />
              ) : null}
              {puntos.length > 1 ? (
                <path className="ui-grafico-tendencia__linea" d={linea} />
              ) : null}
            </svg>

            {/* Fuera del svg: ahi los puntos se deformarian con el estirado. */}
            {principal ? (
              <span
                className="ui-grafico-tendencia__punto"
                style={{ left: `${fraccionPrincipal * 100}%`, top: pct(principal[1]) }}
                aria-hidden="true"
              />
            ) : null}
            {punto ? (
              <>
                <span
                  className="ui-grafico-tendencia__guia"
                  style={{ left: `${fraccion * 100}%` }}
                  aria-hidden="true"
                />
                {puntoPrevio && valorPrevioActivo !== undefined ? (
                  <span
                    className="ui-grafico-tendencia__punto ui-grafico-tendencia__punto--previo"
                    style={{ left: `${fraccion * 100}%`, top: pct(puntoPrevio[1]) }}
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={`ui-grafico-tendencia__tooltip ui-grafico-tendencia__tooltip--${hacia}`}
                  style={{ left: `${fraccion * 100}%` }}
                  aria-hidden="true"
                >
                  {nombreActivo ? (
                    <span className="ui-grafico-tendencia__tooltip-titulo">{nombreActivo}</span>
                  ) : null}
                  <span className="ui-grafico-tendencia__tooltip-fila">
                    <span className="ui-grafico-tendencia__marca-serie" />
                    {etiquetaActual}
                    <b>{formatear(valorActivo)}</b>
                  </span>
                  {valorPrevioActivo !== undefined && etiquetaPrevia ? (
                    <span className="ui-grafico-tendencia__tooltip-fila">
                      <span className="ui-grafico-tendencia__marca-serie ui-grafico-tendencia__marca-serie--previa" />
                      {etiquetaPrevia}
                      <b>{formatear(valorPrevioActivo)}</b>
                    </span>
                  ) : null}
                </span>
              </>
            ) : null}
          </div>

          <div className="ui-grafico-tendencia__eje" aria-hidden="true">
            {marcas.map((marca) => (
              <span
                key={marca.texto}
                className={
                  marca.posicion === 0
                    ? "ui-grafico-tendencia__marca ui-grafico-tendencia__marca--inicio"
                    : marca.posicion === 1
                      ? "ui-grafico-tendencia__marca ui-grafico-tendencia__marca--fin"
                      : "ui-grafico-tendencia__marca"
                }
                style={{ left: `${marca.posicion * 100}%` }}
              >
                {marca.texto}
              </span>
            ))}
            {nombreActivo ? (
              <span className="ui-grafico-tendencia__activa" style={{ left: `${fraccion * 100}%` }}>
                {nombreActivo}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </figure>
  );
}
