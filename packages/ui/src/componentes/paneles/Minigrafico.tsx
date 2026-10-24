import { suavizar, trazo } from "./trazo-serie";
import "./minigrafico.css";

export interface PropsMinigrafico {
  /** Valores en orden del periodo actual; puede ser mas corta que `seriePrevia` (se corta en ahora). */
  serie: number[];
  /**
   * El periodo anterior entero, en los mismos tramos: va detras, punteada y
   * gris. Su largo marca el ancho total, asi la serie actual ocupa solo lo
   * transcurrido y se ve cuanto falta.
   */
  seriePrevia?: number[];
  /** Texto para lectores de pantalla: "Ventas del periodo". */
  etiqueta: string;
}

const ANCHO = 96;
const ALTO = 40;
/** Margen para que el trazo y el punto final no se corten en los bordes. */
const MARGEN = 4;

/** Linea de tendencia sin ejes, para acompañar una cifra. */
export function Minigrafico({ serie, seriePrevia, etiqueta }: PropsMinigrafico) {
  const largo = Math.max(serie.length, seriePrevia?.length ?? 0);
  if (largo < 2 || serie.length === 0) return null;

  // Una sola escala para las dos lineas: asi se ve si el periodo actual va
  // por encima o por debajo del anterior en el mismo punto.
  const todos = seriePrevia ? [...serie, ...seriePrevia] : serie;
  const minimo = Math.min(...todos);
  const rango = Math.max(...todos) - minimo;
  const aPuntos = (valores: number[]) =>
    suavizar(valores).map((valor, i): [number, number] => [
      MARGEN + (i / (largo - 1)) * (ANCHO - MARGEN * 2),
      // Una serie plana queda centrada en vez de pegada al fondo.
      rango === 0 ? ALTO / 2 : ALTO - MARGEN - ((valor - minimo) / rango) * (ALTO - MARGEN * 2),
    ]);
  const puntos = aPuntos(serie);
  const ultimo = puntos[puntos.length - 1];

  return (
    <svg
      className="ui-minigrafico"
      width={ANCHO}
      height={ALTO}
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      role="img"
      aria-label={etiqueta}
    >
      {seriePrevia && seriePrevia.length > 1 ? (
        <path className="ui-minigrafico__previa" d={trazo(aPuntos(seriePrevia))} />
      ) : null}
      {puntos.length > 1 ? <path className="ui-minigrafico__linea" d={trazo(puntos)} /> : null}
      {ultimo ? (
        <circle className="ui-minigrafico__punto" cx={ultimo[0]} cy={ultimo[1]} r={3} />
      ) : null}
    </svg>
  );
}
