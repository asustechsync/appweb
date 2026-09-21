/**
 * Token de sesion: firmado, sin estado.
 *
 * No hay tabla Sesion — con diez tablas al arrancar, una fila por sesion
 * activa es justo lo que ese limite quiere evitar. El token lleva usuarioId,
 * rol y nombre (para pintar la cabecera sin ir a la base) mas una caducidad,
 * y se firma con HMAC-SHA256 contra AUTH_SECRETO. Quien lo lee solo tiene que
 * verificar la firma, nunca consultar nada.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import type { Rol } from "../usuarios/permisos";

export interface CargaSesion {
  usuarioId: string;
  rol: Rol;
  nombre: string;
}

function firmar(datos: string, secreto: string): string {
  return createHmac("sha256", secreto).update(datos).digest("base64url");
}

export function crearTokenSesion(
  carga: CargaSesion,
  secreto: string,
  duracionMs: number,
): string {
  const expira = Date.now() + duracionMs;
  const cuerpo = Buffer.from(JSON.stringify({ ...carga, expira })).toString("base64url");
  const firma = firmar(cuerpo, secreto);
  return `${cuerpo}.${firma}`;
}

/** `null` si la firma no cuadra, el formato es invalido o ya caduco. */
export function verificarTokenSesion(token: string, secreto: string): CargaSesion | null {
  const [cuerpo, firma] = token.split(".");
  if (!cuerpo || !firma) return null;

  const firmaEsperada = firmar(cuerpo, secreto);
  const bufferFirma = Buffer.from(firma);
  const bufferEsperada = Buffer.from(firmaEsperada);
  if (bufferFirma.length !== bufferEsperada.length) return null;
  if (!timingSafeEqual(bufferFirma, bufferEsperada)) return null;

  try {
    const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as CargaSesion & {
      expira: number;
    };
    if (typeof datos.expira !== "number" || Date.now() > datos.expira) return null;
    return { usuarioId: datos.usuarioId, rol: datos.rol, nombre: datos.nombre };
  } catch {
    return null;
  }
}
