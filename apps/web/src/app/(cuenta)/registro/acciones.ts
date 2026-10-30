"use server";

import { registrar as registrarCuenta } from "@appweb/api/acceso";

import { ipDelCliente } from "@/lib/limites";
import { crearCookieSesion } from "@/lib/sesion";

export interface ResultadoRegistro {
  ok: boolean;
  error?: string;
}

/** Las reglas viven en @appweb/api/acceso (las comparte la app movil); aqui solo la cookie. */
export async function registrar(datos: unknown): Promise<ResultadoRegistro> {
  const resultado = await registrarCuenta(datos, await ipDelCliente());
  if (!resultado.ok) return resultado;

  await crearCookieSesion(resultado.carga);
  return { ok: true };
}
