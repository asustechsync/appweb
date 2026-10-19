"use server";

import { hashClave, mensajeDeEspera, nombreDesdeCorreo } from "@appweb/core";
import { esquemaAutorregistro } from "@appweb/core/tipos";
import { prisma } from "@appweb/db";

import { ipDelCliente, limites } from "@/lib/limites";
import { crearCookieSesion } from "@/lib/sesion";

export interface ResultadoRegistro {
  ok: boolean;
  error?: string;
}

export async function registrar(datos: unknown): Promise<ResultadoRegistro> {
  const analizado = esquemaAutorregistro.safeParse(datos);
  if (!analizado.success) {
    return { ok: false, error: analizado.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const cupo = limites.registroPorIp.consumir(await ipDelCliente());
  if (!cupo.permitido) return { ok: false, error: mensajeDeEspera(cupo.reintentarEnMs) };

  const { email, clave, telefono } = analizado.data;
  const nombre = nombreDesdeCorreo(email);

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
      // El registro deja la sesion iniciada: ese es su primer acceso.
      ultimoAccesoEn: new Date(),
    },
  });

  await crearCookieSesion({ usuarioId: usuario.id, rol: usuario.rol, nombre: usuario.nombre });

  return { ok: true };
}
