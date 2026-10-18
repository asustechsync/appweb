/**
 * Enlace para recuperar la clave: firmado, sin tabla.
 *
 * Igual que el token de sesion, no se guarda nada en la base. La firma se
 * calcula sobre el usuario, la caducidad Y el hash de su clave actual: en
 * cuanto la clave cambia, el hash cambia y el enlace deja de valer. Por eso
 * sirve una sola vez sin tener que recordar que ya se uso.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** Una hora: suficiente para abrir el correo, poco para que un enlace viejo sirva. */
export const DURACION_RECUPERACION_MS = 1000 * 60 * 60;

function firmar(cuerpo: string, hashClave: string, secreto: string): string {
  return createHmac("sha256", secreto)
    .update(`recuperacion|${cuerpo}|${hashClave}`)
    .digest("base64url");
}

export function crearTokenRecuperacion(
  usuarioId: string,
  hashClave: string,
  secreto: string,
  ahora = Date.now(),
): string {
  const cuerpo = Buffer.from(
    JSON.stringify({ u: usuarioId, e: ahora + DURACION_RECUPERACION_MS }),
  ).toString("base64url");
  return `${cuerpo}.${firmar(cuerpo, hashClave, secreto)}`;
}

/**
 * Lee a quien pertenece el enlace SIN verificarlo: hace falta para buscar su
 * hash de clave y recien ahi verificar. `null` si el formato no sirve o ya
 * caduco.
 */
export function usuarioDeTokenRecuperacion(token: string, ahora = Date.now()): string | null {
  const [cuerpo] = token.split(".");
  if (!cuerpo) return null;
  try {
    const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as {
      u?: unknown;
      e?: unknown;
    };
    if (typeof datos.u !== "string" || typeof datos.e !== "number") return null;
    return ahora > datos.e ? null : datos.u;
  } catch {
    return null;
  }
}

/** `true` si el enlace es de esa clave, no caduco y nadie lo altero. */
export function verificarTokenRecuperacion(
  token: string,
  hashClave: string,
  secreto: string,
  ahora = Date.now(),
): boolean {
  const [cuerpo, firma] = token.split(".");
  if (!cuerpo || !firma) return false;
  if (usuarioDeTokenRecuperacion(token, ahora) === null) return false;

  const esperada = Buffer.from(firmar(cuerpo, hashClave, secreto));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}
