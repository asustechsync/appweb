import "./minigrafico.css";

export interface PropsMinigrafico {
  /** Valores en orden; con menos de dos no hay linea y no se pinta nada. */
  serie: number[];
  /** Texto para lectores de pantalla: "Ventas del periodo". */
  etiqueta: string;
}

const ANCHO = 96;
const ALTO = 40;
/** Margen para que el trazo y el punto final no se corten en los bordes. */
const MARGEN = 4;

/**
 * Curva suave que pasa por cada punto: Catmull-Rom convertida a beziers
 * cubicas, sin librerias de graficos para una linea de 8 puntos.
 */
function trazo(puntos: [number, number][]): string {
  const [primero] = puntos;
  if (!primero) return "";
  let d = `M${primero[0]},${primero[1]}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] ?? puntos[i];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[i + 2] ?? p2;
    if (!p0 || !p1 || !p2 || !p3) continue;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Linea de tendencia sin ejes, para acompañar una cifra. */
export function Minigrafico({ serie, etiqueta }: PropsMinigrafico) {
  if (serie.length < 2) return null;

  const minimo = Math.min(...serie);
  const rango = Math.max(...serie) - minimo;
  const puntos = serie.map((valor, i): [number, number] => [
    MARGEN + (i / (serie.length - 1)) * (ANCHO - MARGEN * 2),
    // Una serie plana queda centrada en vez de pegada al fondo.
    rango === 0 ? ALTO / 2 : ALTO - MARGEN - ((valor - minimo) / rango) * (ALTO - MARGEN * 2),
  ]);
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
      <path className="ui-minigrafico__linea" d={trazo(puntos)} />
      {ultimo ? (
        <circle className="ui-minigrafico__punto" cx={ultimo[0]} cy={ultimo[1]} r={3} />
      ) : null}
    </svg>
  );
}
