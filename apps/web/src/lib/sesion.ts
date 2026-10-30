import { cookies } from "next/headers";

import { COOKIE_SESION, opcionesCookieSesion, secretoSesion } from "@appweb/api";
import { DURACION_SESION_CORTA_MS, DURACION_SESION_MS } from "@appweb/api/acceso";
import { crearTokenSesion, verificarTokenSesion, type CargaSesion, type Rol } from "@appweb/core";

/**
 * Puente entre el token firmado de @appweb/core y la cookie del navegador.
 *
 * El nombre de la cookie sale de @appweb/api, que es quien tambien la lee
 * desde el panel: una sola definicion para las dos apps.
 *
 * Nunca se importa desde un componente que forme parte del arbol estatico
 * (layout raiz, layout de tienda, layout de compra): leer la cookie ahi
 * volveria dinamica toda esa rama. Solo lo usan hojas (paginas, server
 * actions, route handlers) que ya son dinamicas por su cuenta.
 */

export interface Sesion {
  usuarioId: string;
  rol: Rol;
  nombre: string;
}

export async function crearCookieSesion(carga: CargaSesion, recordar = true): Promise<void> {
  const token = crearTokenSesion(
    carga,
    secretoSesion(),
    recordar ? DURACION_SESION_MS : DURACION_SESION_CORTA_MS,
  );
  const almacen = await cookies();
  almacen.set(COOKIE_SESION, token, {
    ...opcionesCookieSesion(),
    // Sin maxAge la cookie es de sesion: se borra al cerrar el navegador.
    ...(recordar ? { maxAge: DURACION_SESION_MS / 1000 } : {}),
  });
}

export async function borrarCookieSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete({ name: COOKIE_SESION, ...opcionesCookieSesion() });
}

export async function leerSesion(): Promise<Sesion | null> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (!token) return null;

  return verificarTokenSesion(token, secretoSesion());
}
