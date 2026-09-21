"use server";

import { verificarClave } from "@appweb/core";
import { esquemaIngreso } from "@appweb/core/tipos";
import { prisma } from "@appweb/db";

import { crearCookieSesion } from "@/lib/sesion";

export interface ResultadoIngreso {
  ok: boolean;
  error?: string;
}

export async function ingresar(datos: unknown): Promise<ResultadoIngreso> {
  const analizado = esquemaIngreso.safeParse(datos);
  if (!analizado.success) {
    return { ok: false, error: "Revisa el correo y la clave." };
  }

  const { email, clave } = analizado.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mismo mensaje si el correo no existe o si la clave no coincide: decir
  // cual de las dos fallo es regalarle a quien prueba correos al azar cuales
  // si estan registrados.
  if (usuario === null || !usuario.activo || !verificarClave(clave, usuario.clave)) {
    return { ok: false, error: "Correo o clave incorrectos." };
  }

  await crearCookieSesion({ usuarioId: usuario.id, rol: usuario.rol, nombre: usuario.nombre });

  return { ok: true };
}
