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

/** Nota de las reseñas, siempre con un decimal: 4.0, 4.7 */
export const CALIFICACION = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
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

/** 9:30 p. m. */
export const HORA = new Intl.DateTimeFormat("es-PE", { timeStyle: "short", timeZone: ZONA });

/** 18 oct */
const DIA_MES = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: ZONA,
});

/** El dia en Lima como "2026-10-18": para saber si dos instantes caen el mismo dia. */
const DIA_LIMA = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA });

/**
 * Cuando paso algo reciente, como en una lista de actividad: "9:30 p. m." si
 * fue hoy, "Ayer, 9:30 p. m." si fue ayer y "16 oct, 9:30 p. m." si antes.
 */
export function cuandoFue(fecha: Date, ahora = new Date()): string {
  const hora = HORA.format(fecha);
  const dia = DIA_LIMA.format(fecha);
  if (dia === DIA_LIMA.format(ahora)) return hora;
  if (dia === DIA_LIMA.format(new Date(ahora.getTime() - 86_400_000))) return `Ayer, ${hora}`;
  return `${DIA_MES.format(fecha).replace(".", "")}, ${hora}`;
}

/** Una diferencia con su signo siempre visible: "+S/ 12.00", "−3". */
export function conSigno(valor: number, formato?: Intl.NumberFormat): string {
  const texto = formato ? formato.format(Math.abs(valor)) : String(Math.abs(valor));
  return `${valor < 0 ? "−" : "+"}${texto}`;
}

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
