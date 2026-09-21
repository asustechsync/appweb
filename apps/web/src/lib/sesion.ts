import { cookies } from "next/headers";

import { COOKIE_SESION } from "@appweb/api";
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

const DURACION_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

function secreto(): string {
  const valor = process.env["AUTH_SECRETO"];
  if (!valor) {
    throw new Error("Falta AUTH_SECRETO en el entorno. Revisa .env.local.");
  }
  return valor;
}

export interface Sesion {
  usuarioId: string;
  rol: Rol;
  nombre: string;
}

export async function crearCookieSesion(carga: CargaSesion): Promise<void> {
  const token = crearTokenSesion(carga, secreto(), DURACION_MS);
  const almacen = await cookies();
  almacen.set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_MS / 1000,
  });
}

export async function borrarCookieSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(COOKIE_SESION);
}

export async function leerSesion(): Promise<Sesion | null> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (!token) return null;

  return verificarTokenSesion(token, secreto());
}
