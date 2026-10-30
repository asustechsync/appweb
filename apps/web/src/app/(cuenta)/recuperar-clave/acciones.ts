"use server";

import * as acceso from "@appweb/api/acceso";

import { ipDelCliente } from "@/lib/limites";

export interface ResultadoRecuperacion {
  ok: boolean;
  error?: string;
}

/** Manda el enlace. Las reglas viven en @appweb/api/acceso, compartidas con la app movil. */
export async function pedirRecuperacion(datos: unknown): Promise<ResultadoRecuperacion> {
  return acceso.pedirRecuperacion(datos, await ipDelCliente());
}

/** Guarda la clave nueva si el enlace es valido. Despues el enlace ya no sirve. */
export async function restablecerClave(datos: unknown): Promise<ResultadoRecuperacion> {
  return acceso.restablecerClave(datos);
}
