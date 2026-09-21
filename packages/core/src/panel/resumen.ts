/**
 * Reglas del resumen del panel.
 *
 * Que cuenta como venta, que pedido necesita que alguien lo mueva y a partir
 * de cuanto el stock esta bajo son decisiones de negocio: viven aqui y no en
 * la consulta ni en la pantalla, para que el panel, los reportes y la app
 * movil respondan siempre lo mismo.
 */

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

/** Ventana por defecto del resumen: los ultimos 7 dias contra los 7 previos. */
export const DIAS_VENTANA = 7;

/** Medianoche de hace `dias` dias: el dia en curso cuenta entero. */
export function inicioDeHace(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

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

/** Cuantos dias lleva esperando algo creado en `desde`. */
export function diasDesde(desde: Date, ahora = new Date()): number {
  return Math.floor((ahora.getTime() - desde.getTime()) / 86_400_000);
}
