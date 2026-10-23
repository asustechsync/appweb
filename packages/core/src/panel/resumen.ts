/**
 * Reglas del resumen del panel.
 *
 * Que cuenta como venta, que pedido necesita que alguien lo mueva y a partir
 * de cuanto el stock esta bajo son decisiones de negocio: viven aqui y no en
 * la consulta ni en la pantalla, para que el panel, los reportes y la app
 * movil respondan siempre lo mismo.
 */

import { desdeIso, hoyIso } from "../calendario";
import type { EstadoPedido } from "../pedidos/estados";

/** Solo estos estados son plata que entro: lo demas todavia puede caerse. */
export const ESTADOS_VENTA: readonly EstadoPedido[] = [
  "PAGADO",
  "PREPARANDO",
  "ENVIADO",
  "ENTREGADO",
];

/** Un pedido aqui esta esperando que alguien del equipo lo mueva. */
export const ESTADOS_PENDIENTES: readonly EstadoPedido[] = ["PENDIENTE_PAGO", "PAGADO"];

/**
 * Desde cuantas unidades avisamos que una variante se esta acabando.
 *
 * Es un numero fijo y no una columna por variante a proposito: con boxers y
 * medias la reposicion es igual de rapida para todo. El dia que una variante
 * necesite su propio minimo, ese es el momento de que sea columna.
 */
export const UMBRAL_STOCK_BAJO = 5;

/**
 * Cambio porcentual entre dos periodos, redondeado.
 *
 * Sin base con que comparar, pasar de 0 a algo es +100% y de 0 a 0 es 0%:
 * dividir entre cero daria Infinity y el panel pintaria "Infinity%".
 */
export function variacion(actual: number, anterior: number): number {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return Math.round(((actual - anterior) / anterior) * 100);
}

/**
 * En cuantos tramos iguales se parte un periodo para el minigrafico de cada
 * cifra: una hora por tramo en el dia, y el mismo numero en semana y mes para
 * que el periodo actual y el anterior caigan punto contra punto.
 */
export const TRAMOS_SERIE = 24;

/**
 * Suma `valor` de cada registro en su tramo de [desde, hasta). Lo que cae
 * fuera de la ventana se ignora. Un periodo vacio da tramos en cero.
 */
export function serieEnTramos(
  registros: { en: Date; valor: number }[],
  desde: Date,
  hasta: Date,
  tramos = TRAMOS_SERIE,
): number[] {
  const serie = new Array<number>(tramos).fill(0);
  const duracion = hasta.getTime() - desde.getTime();
  if (duracion <= 0) return serie;
  for (const { en, valor } of registros) {
    const indice = Math.floor(((en.getTime() - desde.getTime()) / duracion) * tramos);
    if (indice >= 0 && indice < tramos) serie[indice] = (serie[indice] ?? 0) + valor;
  }
  return serie;
}

/**
 * Suma corrida: cada tramo lleva todo lo anterior, asi la linea nunca baja.
 * Empieza con un 0 (el inicio del periodo): sin el, lo que entra en el primer
 * tramo dejaria la linea arriba desde el principio y la subida no se veria.
 */
export function acumular(serie: number[]): number[] {
  let suma = 0;
  return [
    0,
    ...serie.map((valor) => {
      suma += valor;
      return suma;
    }),
  ];
}

export interface SeriesResumen {
  ventas: number[];
  pedidos: number[];
  ticket: number[];
  clientesNuevos: number[];
}

/**
 * Las cuatro lineas de los minigraficos de un periodo, acumuladas: cada venta
 * hace subir la linea y un tramo sin ventas la deja plana. El ticket es el
 * promedio hasta cada tramo, asi no cae a cero cuando no entra nada.
 *
 * El eje es el periodo entero [desde, fin). Con `corte` (ahora) la linea se
 * detiene en el tramo en curso: lo que falta del periodo aun no paso.
 */
export function seriesDelResumen(
  pedidos: { en: Date; total: number }[],
  altas: Date[],
  desde: Date,
  fin: Date,
  corte?: Date,
): SeriesResumen {
  const duracion = fin.getTime() - desde.getTime();
  // +1 por el 0 de arranque que pone `acumular`.
  const puntos =
    corte && duracion > 0 && corte < fin
      ? Math.ceil(((corte.getTime() - desde.getTime()) / duracion) * TRAMOS_SERIE) + 1
      : TRAMOS_SERIE + 1;
  const serie = (registros: { en: Date; valor: number }[]) =>
    acumular(serieEnTramos(registros, desde, fin)).slice(0, Math.max(puntos, 1));
  const ventas = serie(pedidos.map((p) => ({ en: p.en, valor: p.total })));
  const cantidad = serie(pedidos.map((p) => ({ en: p.en, valor: 1 })));
  return {
    ventas,
    pedidos: cantidad,
    ticket: ventas.map((monto, i) => {
      const n = cantidad[i] ?? 0;
      return n > 0 ? monto / n : 0;
    }),
    clientesNuevos: serie(altas.map((en) => ({ en, valor: 1 }))),
  };
}

/** Cuantos dias lleva esperando algo creado en `desde`. */
export function diasDesde(desde: Date, ahora = new Date()): number {
  return Math.floor((ahora.getTime() - desde.getTime()) / 86_400_000);
}

// ── Periodos de las metricas ────────────────────────────────────────────────

/** Los tres cortes que elige el panel sobre las tarjetas del resumen. */
export const PERIODOS = ["dia", "semana", "mes"] as const;
export type Periodo = (typeof PERIODOS)[number];

export const ETIQUETAS_PERIODO: Record<Periodo, string> = {
  dia: "Día",
  semana: "Semana",
  mes: "Mes",
};

export interface VentanaResumen {
  /** Inicio del periodo actual. */
  desde: Date;
  /** Fin (exclusivo) del periodo actual. `null` = llega hasta ahora. */
  hasta: Date | null;
  /** Donde termina el periodo entero (mañana, el lunes que viene, el dia 1): el eje del minigrafico. */
  fin: Date;
  /** El periodo anterior entero, contra el que se compara: [previoDesde, previoHasta). */
  previoDesde: Date;
  previoHasta: Date;
  /** Nombre del periodo anterior para el pie de cada cifra: "Ayer". */
  etiquetaPrevio: string;
  titulo: string;
  /** Texto bajo cada cifra: "más que la semana pasada". */
  contexto: string;
}

/**
 * Que fechas cubre cada periodo y contra cual se compara.
 *
 *   · Dia    — de hoy a esta hora contra todo ayer.
 *   · Semana — de lunes a hoy contra toda la semana pasada.
 *   · Mes    — del dia 1 a hoy contra todo el mes pasado.
 *
 * Contra el periodo anterior entero a proposito: "hoy" se lee contra lo que
 * se vendio ayer, y queda en rojo hasta que lo supera.
 */
export function ventanaDe(periodo: Periodo, ahora = new Date()): VentanaResumen {
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);

  if (periodo === "dia") {
    const previoDesde = new Date(hoy);
    previoDesde.setDate(hoy.getDate() - 1);
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() + 1);
    return {
      desde: hoy,
      hasta: null,
      fin,
      previoDesde,
      previoHasta: hoy,
      etiquetaPrevio: "Ayer",
      titulo: "Hoy",
      contexto: "más que ayer",
    };
  }

  if (periodo === "semana") {
    // Lunes como primer dia: getDay() da domingo = 0.
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const previoDesde = new Date(desde);
    previoDesde.setDate(desde.getDate() - 7);
    const fin = new Date(desde);
    fin.setDate(desde.getDate() + 7);
    return {
      desde,
      hasta: null,
      fin,
      previoDesde,
      previoHasta: desde,
      etiquetaPrevio: "Semana pasada",
      titulo: "Esta semana",
      contexto: "más que la semana pasada",
    };
  }

  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const previoDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  return {
    desde,
    hasta: null,
    fin: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1),
    previoDesde,
    previoHasta: desde,
    etiquetaPrevio: "Mes pasado",
    titulo: "Este mes",
    contexto: "más que el mes pasado",
  };
}

/**
 * Un dia concreto contra el dia anterior entero. Un dia pasado se mide entero;
 * hoy se mide hasta esta hora, como el periodo "Dia".
 * Una fecha futura o invalida cuenta como hoy: no hay ventas que mostrar.
 */
export function ventanaDeFecha(iso: string, ahora = new Date()): VentanaResumen {
  const elegida = desdeIso(iso);
  if (elegida === null || iso >= hoyIso(ahora)) return ventanaDe("dia", ahora);

  const hasta = new Date(elegida);
  hasta.setDate(elegida.getDate() + 1);
  const previoDesde = new Date(elegida);
  previoDesde.setDate(elegida.getDate() - 1);

  return {
    desde: elegida,
    hasta,
    fin: hasta,
    previoDesde,
    previoHasta: elegida,
    etiquetaPrevio: "Día anterior",
    titulo: new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(elegida),
    contexto: "más que el día anterior",
  };
}
