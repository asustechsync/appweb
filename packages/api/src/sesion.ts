/**
 * De la cookie del navegador a la sesion del contexto.
 *
 * El nombre de la cookie y la verificacion viven aqui, no en cada app: la
 * tienda escribe el token y el panel lo lee, y si cada uno tuviera su propia
 * copia del nombre bastaria una letra distinta para que el panel no reconozca
 * a nadie sin dar ningun error.
 *
 * La verificacion es local (HMAC contra AUTH_SECRETO): cero viajes a la base
 * para saber quien pregunta.
 */

import { verificarTokenSesion } from "@appweb/core";

import type { Sesion } from "./trpc";

export const COOKIE_SESION = "appweb_sesion";

export function sesionDesdeToken(token: string | undefined): Sesion | null {
  if (!token) return null;

  const secreto = process.env["AUTH_SECRETO"];
  if (!secreto) {
    throw new Error("Falta AUTH_SECRETO en el entorno. Revisa .env.local.");
  }

  return verificarTokenSesion(token, secreto);
}

/** Saca el token de una cabecera `Cookie` cruda, para los route handlers. */
export function tokenDeCabeceraCookie(cabecera: string | null): string | undefined {
  if (!cabecera) return undefined;

  for (const parte of cabecera.split(";")) {
    const [nombre, ...resto] = parte.trim().split("=");
    if (nombre === COOKIE_SESION) return resto.join("=");
  }

  return undefined;
}
