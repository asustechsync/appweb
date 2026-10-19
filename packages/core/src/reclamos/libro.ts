/**
 * Libro de Reclamaciones virtual (Codigo de Proteccion y Defensa del
 * Consumidor, Ley 29571, y su reglamento del Libro de Reclamaciones).
 *
 * Lo que la norma exige y vive aqui:
 *   · Cada hoja lleva un numero correlativo.
 *   · Reclamo = disconformidad con el producto o servicio.
 *     Queja    = malestar con la atencion, sin ser sobre el producto.
 *   · La respuesta llega al consumidor en 15 dias habiles improrrogables.
 *   · La hoja se conserva (minimo dos años): nunca se borra ni se edita, la
 *     respuesta se escribe una sola vez.
 */

export const TIPOS_RECLAMO = ["RECLAMO", "QUEJA"] as const;
export type TipoReclamo = (typeof TIPOS_RECLAMO)[number];

export const ETIQUETAS_TIPO_RECLAMO: Record<TipoReclamo, string> = {
  RECLAMO: "Reclamo",
  QUEJA: "Queja",
};

export const DESCRIPCION_TIPO_RECLAMO: Record<TipoReclamo, string> = {
  RECLAMO: "Disconformidad con el producto o el servicio que compraste.",
  QUEJA: "Malestar con la atención, sin relación directa con el producto.",
};

export const TIPOS_BIEN = ["PRODUCTO", "SERVICIO"] as const;
export type TipoBien = (typeof TIPOS_BIEN)[number];

export const ETIQUETAS_TIPO_BIEN: Record<TipoBien, string> = {
  PRODUCTO: "Producto",
  SERVICIO: "Servicio",
};

export const ESTADOS_RECLAMO = ["PENDIENTE", "RESPONDIDO"] as const;
export type EstadoReclamo = (typeof ESTADOS_RECLAMO)[number];

export const ETIQUETAS_ESTADO_RECLAMO: Record<EstadoReclamo, string> = {
  PENDIENTE: "Pendiente",
  RESPONDIDO: "Respondido",
};

/** Plazo legal de respuesta. */
export const DIAS_HABILES_RESPUESTA = 15;

/**
 * Las fechas se cuentan en hora de Lima (UTC-5, sin horario de verano), no en
 * la del servidor: un reclamo del viernes a las 8 pm en Lima ya es sabado en
 * UTC, y contar desde ahi correria el plazo un dia.
 */
const DESFASE_LIMA_MS = -5 * 60 * 60 * 1000;

function enLima(fecha: Date): Date {
  return new Date(fecha.getTime() + DESFASE_LIMA_MS);
}

/**
 * Numero de hoja como lo ve el consumidor: correlativo de seis cifras y el
 * año en que se registro. `7` del 2026 -> "000007-2026".
 */
export function codigoReclamo(numero: number, creadoEn: Date): string {
  return `${String(numero).padStart(6, "0")}-${enLima(creadoEn).getUTCFullYear()}`;
}

/**
 * Ultimo momento para responder: fin del dia habil numero 15, contando desde
 * el siguiente al registro. Solo salta sabados y domingos, no feriados: si un
 * feriado cae en medio, el plazo calculado vence un dia ANTES del real. Mejor
 * responder un dia antes que uno tarde.
 */
export function venceReclamo(creadoEn: Date): Date {
  const fecha = enLima(creadoEn);
  fecha.setUTCHours(23, 59, 59, 999);
  let contados = 0;
  while (contados < DIAS_HABILES_RESPUESTA) {
    fecha.setUTCDate(fecha.getUTCDate() + 1);
    const dia = fecha.getUTCDay();
    if (dia !== 0 && dia !== 6) contados += 1;
  }
  return new Date(fecha.getTime() - DESFASE_LIMA_MS);
}

/** Dias calendario que faltan para el vencimiento. Negativo = ya vencio. */
export function diasParaVencer(creadoEn: Date, ahora: Date = new Date()): number {
  const vence = venceReclamo(creadoEn);
  const dia = 24 * 60 * 60 * 1000;
  return Math.ceil((vence.getTime() - ahora.getTime()) / dia);
}

export type RechazoReclamo = "ya_respondido";

/** La respuesta se escribe una vez: la hoja respondida no se reescribe. */
export function revisarRespuesta(estado: EstadoReclamo): RechazoReclamo | null {
  return estado === "RESPONDIDO" ? "ya_respondido" : null;
}

export function mensajeDeRechazoReclamo(rechazo: RechazoReclamo): string {
  switch (rechazo) {
    case "ya_respondido":
      return "Este reclamo ya fue respondido. La respuesta no se puede cambiar.";
  }
}
