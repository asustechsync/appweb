/**
 * Reglas del resumen del panel.
 *
 * Que cuenta como venta, que pedido necesita que alguien lo mueva y a partir
 * de cuanto el stock esta bajo son decisiones de negocio: viven aqui y no en
 * la consulta ni en la pantalla, para que el panel, los reportes y la app
 * movil respondan siempre lo mismo.
 */

import { desdeIso, hoyIso } from "../calendario";
import { factorDeDescuento, margenDeVentas, vendidoDe } from "../catalogo/compras";
import { horaDeLima } from "../formato";
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

/**
 * Una linea de minigrafico: `valor` de cada registro acumulado sobre el
 * periodo [desde, fin). Con `corte` (ahora) se detiene en el tramo en curso.
 */
export function serieAcumulada(
  registros: { en: Date; valor: number }[],
  desde: Date,
  fin: Date,
  corte?: Date,
): number[] {
  const duracion = fin.getTime() - desde.getTime();
  // +1 por el 0 de arranque que pone `acumular`.
  const puntos =
    corte && duracion > 0 && corte < fin
      ? Math.ceil(((corte.getTime() - desde.getTime()) / duracion) * TRAMOS_SERIE) + 1
      : TRAMOS_SERIE + 1;
  return acumular(serieEnTramos(registros, desde, fin)).slice(0, Math.max(puntos, 1));
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
  const serie = (registros: { en: Date; valor: number }[]) =>
    serieAcumulada(registros, desde, fin, corte);
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

/**
 * Cuanto pasa en cada hora del reloj (0 a 23, hora de Lima) a lo largo del
 * periodo entero: las horas fuertes de la tienda. Cada serie tiene 24 valores.
 * El ticket es el promedio de cada hora y queda en 0 si no entro nada.
 */
export function franjasDelResumen(
  pedidos: { en: Date; total: number }[],
  altas: Date[],
): SeriesResumen {
  const vacia = () => Array.from({ length: 24 }, () => 0);
  const ventas = vacia();
  const cantidad = vacia();
  const clientesNuevos = vacia();
  for (const pedido of pedidos) {
    const hora = horaDeLima(pedido.en);
    ventas[hora] = (ventas[hora] ?? 0) + pedido.total;
    cantidad[hora] = (cantidad[hora] ?? 0) + 1;
  }
  for (const alta of altas) {
    const hora = horaDeLima(alta);
    clientesNuevos[hora] = (clientesNuevos[hora] ?? 0) + 1;
  }
  return {
    ventas,
    pedidos: cantidad,
    ticket: ventas.map((monto, i) => {
      const n = cantidad[i] ?? 0;
      return n > 0 ? monto / n : 0;
    }),
    clientesNuevos,
  };
}

/**
 * El mejor y el peor punto de una serie y su promedio: la linea de resumen bajo
 * la grafica. Con empate gana el primero. Una serie vacia da todo en cero.
 */
export function extremosDeSerie(valores: number[]): {
  mejor: { indice: number; valor: number };
  peor: { indice: number; valor: number };
  promedio: number;
} {
  if (valores.length === 0) {
    return { mejor: { indice: 0, valor: 0 }, peor: { indice: 0, valor: 0 }, promedio: 0 };
  }
  const mejorValor = Math.max(...valores);
  const peorValor = Math.min(...valores);
  return {
    mejor: { indice: valores.indexOf(mejorValor), valor: mejorValor },
    peor: { indice: valores.indexOf(peorValor), valor: peorValor },
    promedio: valores.reduce((suma, v) => suma + v, 0) / valores.length,
  };
}

/** Lo que entro en cada tramo: la diferencia con el punto anterior (el primero queda en 0). */
function porTramo(acumulada: number[]): number[] {
  return acumulada.map((valor, i) => (i === 0 ? 0 : Math.max(0, valor - (acumulada[i - 1] ?? 0))));
}

/**
 * Las mismas series pero de lo que entro en cada tramo, no acumuladas: la linea
 * sube y baja segun cuanto se vendio en ese tramo. El ticket es el de cada
 * tramo (ventas entre pedidos del tramo) y queda en 0 si no entro nada.
 * Sirve para Semana y Mes; en un dia el acumulado se lee mejor.
 */
export function seriesPorTramo(series: SeriesResumen): SeriesResumen {
  const ventas = porTramo(series.ventas);
  const pedidos = porTramo(series.pedidos);
  return {
    ventas,
    pedidos,
    ticket: ventas.map((monto, i) => {
      const n = pedidos[i] ?? 0;
      return n > 0 ? monto / n : 0;
    }),
    clientesNuevos: porTramo(series.clientesNuevos),
  };
}

/** Cuanto entro por un medio de pago y que parte del total es. */
export interface RepartoMedio<M extends string = string> {
  medio: M;
  monto: number;
  pagos: number;
  /** Porcentaje entero del monto total; entre todos suman 100. */
  porcentaje: number;
}

/**
 * Los medios de pago ordenados de mas a menos plata, con su porcentaje. Los
 * que no recibieron nada se quedan, al final y en 0%: el panel muestra todos
 * los medios para que se note cual no se esta usando.
 *
 * Los porcentajes se reparten por mayor resto: redondear cada uno por su lado
 * podria sumar 99 o 101, y la leyenda mostraria un total que no cuadra.
 */
export function repartoPorMedio<M extends string>(
  grupos: { medio: M; monto: number; pagos: number }[],
): RepartoMedio<M>[] {
  const total = grupos.reduce((suma, grupo) => suma + grupo.monto, 0);
  const ordenados = [...grupos].sort((a, b) => b.monto - a.monto);
  if (total <= 0) return ordenados.map((grupo) => ({ ...grupo, porcentaje: 0 }));

  const exactos = ordenados.map((grupo) => (grupo.monto / total) * 100);
  const enteros = exactos.map(Math.floor);
  let faltan = 100 - enteros.reduce((suma, n) => suma + n, 0);
  const porResto = exactos
    .map((valor, i) => ({ i, resto: valor - Math.floor(valor) }))
    .sort((a, b) => b.resto - a.resto);
  for (const { i } of porResto) {
    if (faltan <= 0) break;
    enteros[i] = (enteros[i] ?? 0) + 1;
    faltan--;
  }

  return ordenados.map((grupo, i) => ({ ...grupo, porcentaje: enteros[i] ?? 0 }));
}

/** Una marca del eje horizontal: dónde cae en el periodo (0 a 1) y qué dice. */
export interface MarcaEje {
  posicion: number;
  texto: string;
}

const DIA_MS = 86_400_000;

/**
 * Las marcas del eje de la tendencia segun el largo del periodo:
 *
 *   · un dia      — cada 6 horas: 0 h, 6 h, 12 h, 18 h, y 24 h al final del eje.
 *   · una semana  — un dia por marca, en su hora 0: Lun … Dom.
 *   · un mes      — cinco marcas repartidas por igual, del 1 al ultimo dia.
 *
 * Las posiciones son fracciones del periodo entero, las mismas que usan las
 * series: asi la marca cae justo bajo el tramo que nombra.
 */
export function marcasDelEje(desde: Date, fin: Date): MarcaEje[] {
  const duracion = fin.getTime() - desde.getTime();
  if (duracion <= 0) return [];
  const dias = Math.round(duracion / DIA_MS);

  if (dias <= 1) {
    return [0, 6, 12, 18, 24].map((hora) => ({
      posicion: hora / 24,
      texto: `${hora} h`,
    }));
  }

  if (dias <= 8) {
    return Array.from({ length: dias }, (_, i) => {
      const dia = new Date(desde);
      dia.setDate(desde.getDate() + i);
      const nombre = new Intl.DateTimeFormat("es-PE", { weekday: "short" })
        .format(dia)
        .replace(".", "");
      return {
        posicion: i / dias,
        texto: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      };
    });
  }

  // Cinco marcas repartidas por igual, de modo que la ultima sea siempre el
  // ultimo dia del mes (28, 29, 30 o 31) y el eje cubra el mes entero.
  return [0, 1, 2, 3, 4].map((i) => {
    const dia = Math.round(1 + (i * (dias - 1)) / 4);
    return { posicion: i === 4 ? 1 : (dia - 1) / dias, texto: String(dia) };
  });
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
  dia: "1D",
  semana: "7D",
  mes: "1M",
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
      etiquetaPrevio: "Sem. pasada",
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
    titulo: new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(elegida),
    contexto: "más que el día anterior",
  };
}

// ── Historial corto de las tarjetas ─────────────────────────────────────────

/** Cuantas barras lleva el minigrafico de cada tarjeta: el periodo actual y los seis anteriores. */
export const BARRAS_HISTORIAL = 7;

export interface TramoHistorial {
  desde: Date;
  /** Fin exclusivo. */
  hasta: Date;
}

/** Mueve una fecha `pasos` periodos hacia atras: dias, semanas o meses del calendario. */
function retroceder(fecha: Date, periodo: Periodo, pasos: number): Date {
  const movida = new Date(fecha);
  if (periodo === "mes") movida.setMonth(fecha.getMonth() - pasos);
  else movida.setDate(fecha.getDate() - pasos * (periodo === "semana" ? 7 : 1));
  return movida;
}

/**
 * Los periodos que terminan en el actual, del mas viejo al actual: hoy y los
 * seis dias anteriores, esta semana y las seis anteriores, o este mes y los
 * seis anteriores. El penultimo es justo el periodo anterior de la ventana,
 * asi las dos ultimas barras coinciden con la cifra y su "Ayer".
 */
export function tramosDelHistorial(
  ventana: VentanaResumen,
  periodo: Periodo,
  cantidad = BARRAS_HISTORIAL,
): TramoHistorial[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const pasos = cantidad - 1 - i;
    return {
      desde: retroceder(ventana.desde, periodo, pasos),
      hasta:
        pasos === 0
          ? (ventana.hasta ?? ventana.fin)
          : retroceder(ventana.desde, periodo, pasos - 1),
    };
  });
}

export interface HistorialClientes {
  nuevos: number[];
  compradores: number[];
  recurrentes: number[];
}

/**
 * Clientes de cada tramo del historial:
 *
 *   · Nuevos      — cuentas creadas en el tramo.
 *   · Compradores — clientes distintos con al menos una venta en el tramo.
 *   · Recurrentes — compradores del tramo que ya habian comprado antes de el.
 *
 * `primeraCompra` es la venta mas antigua de cada comprador, de siempre.
 */
export function historialDeClientes(
  tramos: TramoHistorial[],
  altas: Date[],
  ventas: { usuarioId: string; en: Date }[],
  primeraCompra: ReadonlyMap<string, Date>,
): HistorialClientes {
  const dentro = (en: Date, tramo: TramoHistorial) => en >= tramo.desde && en < tramo.hasta;
  const historial: HistorialClientes = { nuevos: [], compradores: [], recurrentes: [] };
  for (const tramo of tramos) {
    const compradores = new Set(
      ventas.filter((venta) => dentro(venta.en, tramo)).map((venta) => venta.usuarioId),
    );
    let recurrentes = 0;
    for (const usuarioId of compradores) {
      const primera = primeraCompra.get(usuarioId);
      if (primera && primera < tramo.desde) recurrentes += 1;
    }
    historial.nuevos.push(altas.filter((alta) => dentro(alta, tramo)).length);
    historial.compradores.push(compradores.size);
    historial.recurrentes.push(recurrentes);
  }
  return historial;
}

export interface HistorialVentas {
  ganancia: number[];
  margen: number[];
  descuentos: number[];
  recibidos: number[];
  pagados: number[];
  cancelados: number[];
  ticket: number[];
  ticketMaximo: number[];
  ticketMinimo: number[];
}

/**
 * Ventas, pedidos y ticket de cada tramo del historial: las barras de las
 * tarjetas de Ventas, Pedidos y Ticket.
 *
 *   · Recibidos / cancelados — pedidos creados en el tramo, tengan el estado que tengan.
 *   · Pagados — los que cuentan como venta (`estadosVenta`); de ellos salen
 *     el ticket, el descuento y, con sus lineas, la ganancia y el margen.
 */
export function historialDeVentas(
  tramos: TramoHistorial[],
  pedidos: { en: Date; estado: string; subtotal: number; descuento: number }[],
  lineas: {
    en: Date;
    precioUnitario: number;
    costoUnitario: number | null;
    cantidad: number;
    subtotal: number;
    descuento: number;
  }[],
  estadosVenta: readonly string[],
): HistorialVentas {
  const dentro = (en: Date, tramo: TramoHistorial) => en >= tramo.desde && en < tramo.hasta;
  const historial: HistorialVentas = {
    ganancia: [],
    margen: [],
    descuentos: [],
    recibidos: [],
    pagados: [],
    cancelados: [],
    ticket: [],
    ticketMaximo: [],
    ticketMinimo: [],
  };
  for (const tramo of tramos) {
    const delTramo = pedidos.filter((pedido) => dentro(pedido.en, tramo));
    const vendidos = delTramo.filter((pedido) => estadosVenta.includes(pedido.estado));
    const montos = vendidos.map((pedido) => vendidoDe(pedido));
    const margen = margenDeVentas(
      lineas
        .filter((linea) => dentro(linea.en, tramo))
        .map((linea) => ({
          precioUnitario:
            linea.precioUnitario * factorDeDescuento(linea.subtotal, linea.descuento),
          costoUnitario: linea.costoUnitario,
          cantidad: linea.cantidad,
        })),
    );
    historial.ganancia.push(margen.ganancia);
    historial.margen.push(margen.porcentaje);
    historial.descuentos.push(vendidos.reduce((suma, pedido) => suma + pedido.descuento, 0));
    historial.recibidos.push(delTramo.length);
    historial.pagados.push(vendidos.length);
    historial.cancelados.push(delTramo.filter((pedido) => pedido.estado === "CANCELADO").length);
    historial.ticket.push(
      montos.length > 0 ? montos.reduce((suma, monto) => suma + monto, 0) / montos.length : 0,
    );
    historial.ticketMaximo.push(montos.length > 0 ? Math.max(...montos) : 0);
    historial.ticketMinimo.push(montos.length > 0 ? Math.min(...montos) : 0);
  }
  return historial;
}
