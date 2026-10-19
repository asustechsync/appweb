"use server";

import { mensajeDeEspera, verificarClave } from "@appweb/core";
import { esquemaIngreso } from "@appweb/core/tipos";
import { prisma } from "@appweb/db";

import { ipDelCliente, limites } from "@/lib/limites";
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

  // Dos cuentas: por IP (cualquier intento) y por correo (solo los fallidos,
  // y se borra al acertar). Asi un cliente que olvido la clave no bloquea a
  // nadie mas, y quien prueba claves contra una cuenta se frena a los cinco.
  const ip = await ipDelCliente();
  const porIp = limites.ingresoPorIp.consumir(ip);
  if (!porIp.permitido) return { ok: false, error: mensajeDeEspera(porIp.reintentarEnMs) };
  const porCorreo = limites.ingresoPorCorreo.revisar(email);
  if (!porCorreo.permitido) return { ok: false, error: mensajeDeEspera(porCorreo.reintentarEnMs) };

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Mismo mensaje si el correo no existe o si la clave no coincide: decir
  // cual de las dos fallo es regalarle a quien prueba correos al azar cuales
  // si estan registrados.
  if (usuario === null || !usuario.activo || !verificarClave(clave, usuario.clave)) {
    limites.ingresoPorCorreo.registrar(email);
    return { ok: false, error: "Correo o contraseña incorrectos" };
  }
  limites.ingresoPorCorreo.limpiar(email);

  // `editadoEn` se pasa tal cual: entrar no es editar el perfil, y sin esto
  // @updatedAt lo moveria en cada inicio de sesion.
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAccesoEn: new Date(), editadoEn: usuario.editadoEn },
  });

  await crearCookieSesion(
    { usuarioId: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    recordar,
  );

  return { ok: true };
}
