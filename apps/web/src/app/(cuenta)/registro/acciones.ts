"use server";

import { hashClave } from "@appweb/core";
import { esquemaRegistro } from "@appweb/core/tipos";
import { prisma } from "@appweb/db";

import { crearCookieSesion } from "@/lib/sesion";

export interface ResultadoRegistro {
  ok: boolean;
  error?: string;
}

export async function registrar(datos: unknown): Promise<ResultadoRegistro> {
  const analizado = esquemaRegistro.safeParse(datos);
  if (!analizado.success) {
    return { ok: false, error: analizado.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { nombre, email, clave, telefono } = analizado.data;

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente !== null) {
    return { ok: false, error: "Ya existe una cuenta con ese correo." };
  }

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      clave: hashClave(clave),
      telefono: telefono ?? null,
    },
  });

  await crearCookieSesion({ usuarioId: usuario.id, rol: usuario.rol, nombre: usuario.nombre });

  return { ok: true };
}
