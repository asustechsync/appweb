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
    return { ok: false, error: "Correo o contraseña incorrectos" };
  }

  const { email, clave, recordar } = analizado.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mismo mensaje si el correo no existe o si la clave no coincide: decir
  // cual de las dos fallo es regalarle a quien prueba correos al azar cuales
  // si estan registrados.
  if (usuario === null || !usuario.activo || !verificarClave(clave, usuario.clave)) {
    return { ok: false, error: "Correo o contraseña incorrectos" };
  }

  // `editadoEn` se pasa tal cual: entrar no es editar el perfil, y sin esto
  // @updatedAt lo moveria en cada inicio de sesion.
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAccesoEn: new Date(), editadoEn: usuario.editadoEn },
  });

  await crearCookieSesion({ usuarioId: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, recordar);

  return { ok: true };
}
