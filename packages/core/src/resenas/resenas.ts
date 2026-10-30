/**
 * Reseñas de producto: quien puede escribirlas, cuando se publican y como se
 * resume la nota que ven la tarjeta y la ficha.
 *
 *   · Solo opina quien recibio el producto: un pedido ENTREGADO que lo traiga.
 *     Asi cada reseña es de una compra real.
 *   · Una reseña por cliente y producto. Mientras no se publique, el cliente
 *     la puede reescribir; publicada, queda como esta.
 *   · Toda reseña nueva o reescrita espera a que el panel la apruebe.
 */

import type { EstadoPedido } from "../pedidos/estados";
import { estaAnonimizada } from "../usuarios/administracion";

export const ESTADOS_RESENA = ["PENDIENTE", "APROBADA", "RECHAZADA"] as const;
export type EstadoResena = (typeof ESTADOS_RESENA)[number];

/** Lo que el panel puede decidir sobre una reseña. */
export const DECISIONES_RESENA = ["APROBADA", "RECHAZADA"] as const;
export type DecisionResena = (typeof DECISIONES_RESENA)[number];

export const ETIQUETAS_ESTADO_RESENA: Record<EstadoResena, string> = {
  PENDIENTE: "En revisión",
  APROBADA: "Publicada",
  RECHAZADA: "No publicada",
};

/** Tono de la etiqueta: verde publicada, ambar mientras espera revision, rojo si no se publico. */
export function tonoDeEstadoResena(estado: EstadoResena): "exito" | "alerta" | "error" {
  if (estado === "APROBADA") return "exito";
  if (estado === "PENDIENTE") return "alerta";
  return "error";
}

export const MIN_ESTRELLAS = 1;
export const MAX_ESTRELLAS = 5;
export const MAX_LETRAS_COMENTARIO = 1000;

/** Estados del pedido con los que el cliente ya tiene el producto en la mano. */
export const ESTADOS_QUE_HABILITAN_RESENA: readonly EstadoPedido[] = ["ENTREGADO"];

export type RechazoResena = "sin_compra" | "ya_publicada";

/**
 * Si el cliente puede escribir (o reescribir) su reseña. `estadoActual` es el
 * de la reseña que ya dejo para ese producto, o `null` si es la primera.
 */
export function revisarResena(datos: {
  compro: boolean;
  estadoActual: EstadoResena | null;
}): RechazoResena | null {
  if (!datos.compro) return "sin_compra";
  if (datos.estadoActual === "APROBADA") return "ya_publicada";
  return null;
}

export function mensajeDeRechazoResena(rechazo: RechazoResena): string {
  switch (rechazo) {
    case "sin_compra":
      return "Solo puedes opinar sobre productos que ya recibiste.";
    case "ya_publicada":
      return "Tu reseña de este producto ya está publicada y no se puede cambiar.";
  }
}

export interface ResumenCalificacion {
  /** Nota media con un decimal: 4.7. */
  promedio: number;
  /** Reseñas publicadas. */
  total: number;
}

/**
 * Nota media de las reseñas publicadas a partir de su cantidad y la suma de
 * sus estrellas (lo que devuelve un `groupBy`). `null` sin reseñas: mejor no
 * mostrar nota que mostrar un cero.
 */
export function resumenCalificacion(
  total: number,
  sumaEstrellas: number,
): ResumenCalificacion | null {
  if (total <= 0) return null;
  return { promedio: Math.round((sumaEstrellas / total) * 10) / 10, total };
}

/**
 * Como firma el cliente en la tienda: nombre de pila e inicial del apellido,
 * "Leonardo Q.". Nunca el correo ni el apellido completo. Una cuenta
 * eliminada firma "Cliente".
 */
export function autorDeResena(datos: {
  nombre: string;
  apellidoPaterno: string | null;
  email: string;
}): string {
  if (estaAnonimizada(datos.email)) return "Cliente";
  const nombre = datos.nombre.trim().split(/\s+/)[0] ?? "";
  const inicial = datos.apellidoPaterno?.trim().charAt(0).toUpperCase() ?? "";
  if (nombre === "") return "Cliente";
  return inicial ? `${nombre} ${inicial}.` : nombre;
}
