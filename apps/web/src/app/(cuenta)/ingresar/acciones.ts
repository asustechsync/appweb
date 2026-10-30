"use server";

import { ingresar as ingresarConClave } from "@appweb/api/acceso";

import { ipDelCliente } from "@/lib/limites";
import { crearCookieSesion } from "@/lib/sesion";

export interface ResultadoIngreso {
  ok: boolean;
  error?: string;
}

/** Las reglas viven en @appweb/api/acceso (las comparte la app movil); aqui solo la cookie. */
export async function ingresar(datos: unknown): Promise<ResultadoIngreso> {
  const resultado = await ingresarConClave(datos, await ipDelCliente());
  if (!resultado.ok) return resultado;

  await crearCookieSesion(resultado.carga, resultado.recordar);
  return { ok: true };
}
