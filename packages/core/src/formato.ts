/**
 * Como se escriben montos, fechas y numeros en TODA la plataforma: tienda,
 * panel, correos, WhatsApp y la app movil. Un solo sitio: cambiar el formato
 * de la fecha es cambiarlo aqui.
 *
 * Las fechas van siempre en hora de Lima, no en la del servidor (UTC) ni en la
 * del navegador: un pedido de las 9 pm no puede aparecer como del dia
 * siguiente en el correo.
 *
 * Sin dependencias: se importa por su ruta (`@appweb/core/formato`) desde
 * componentes de cliente sin arrastrar el resto de core al navegador.
 */

const ZONA = "America/Lima";

/** S/ 29.90 */
export const MONEDA = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** 18 oct 2026 */
export const FECHA = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: ZONA });

/** 18 oct 2026, 9:30 p. m. */
export const FECHA_HORA = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: ZONA,
});

/** 18 de octubre de 2026 */
export const FECHA_LARGA = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: ZONA });

/** 18 de octubre de 2026, 9:30 p. m. */
export const FECHA_HORA_LARGA = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: ZONA,
});

/**
 * Lo que la persona escribe en un campo de monto o cantidad: "29,90" o
 * "29.90" -> 29.9. Vacio -> NaN, que zod rechaza con su propio mensaje.
 */
export function numeroDesdeTexto(texto: string): number {
  const limpio = texto.trim();
  return limpio === "" ? Number.NaN : Number(limpio.replace(",", "."));
}

/** El mensaje de un error para mostrarlo tal cual, o `respaldo` si no trae uno. */
export function mensajeDeFallo(
  fallo: unknown,
  respaldo = "No se pudo completar la acción.",
): string {
  return fallo instanceof Error ? fallo.message : respaldo;
}
