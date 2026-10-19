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

import { entorno } from "./entorno";

import type { Sesion } from "./trpc";

export const COOKIE_SESION = "appweb_sesion";

/**
 * Opciones de la cookie, las mismas al escribirla (tienda) y al borrarla (las
 * dos apps): un `delete` con otro dominio no borra nada.
 *
 * En produccion la tienda y el panel viven en subdominios distintos
 * (tutienda.pe y panel.tutienda.pe). Sin `COOKIE_DOMINIO=.tutienda.pe` la
 * cookie queda atada al subdominio que la escribio y el panel nunca la ve. En
 * local no hace falta: las cookies ignoran el puerto.
 */
export function opcionesCookieSesion() {
  const { COOKIE_DOMINIO: dominio, produccion } = entorno();
  return {
    httpOnly: true,
    secure: produccion,
    sameSite: "lax" as const,
    path: "/",
    ...(dominio ? { domain: dominio } : {}),
  };
}

/** Clave con la que se firman la sesion y los enlaces de recuperacion. */
export function secretoSesion(): string {
  const secreto = entorno().AUTH_SECRETO;
  if (!secreto) throw new Error("Falta AUTH_SECRETO en el entorno. Revisa .env.local.");
  return secreto;
}

export function sesionDesdeToken(token: string | undefined): Sesion | null {
  if (!token) return null;

  return verificarTokenSesion(token, secretoSesion());
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
