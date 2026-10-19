"use server";

import {
  correoRecuperacion,
  crearTokenRecuperacion,
  hashClave,
  mensajeDeEspera,
  usuarioDeTokenRecuperacion,
  verificarTokenRecuperacion,
} from "@appweb/core";
import { esquemaNuevaClave, esquemaRecuperacion } from "@appweb/core/tipos";
import { secretoSesion } from "@appweb/api";
import { enviarCorreo } from "@appweb/api/correo";
import { URL_TIENDA } from "@appweb/api/urls";
import { prisma } from "@appweb/db";

import { ipDelCliente, limites } from "@/lib/limites";

export interface ResultadoRecuperacion {
  ok: boolean;
  error?: string;
}

/**
 * Manda el enlace. Responde lo mismo exista o no la cuenta: decir "ese correo
 * no esta registrado" es regalarle a cualquiera la lista de clientes.
 */
export async function pedirRecuperacion(datos: unknown): Promise<ResultadoRecuperacion> {
  const analizado = esquemaRecuperacion.safeParse(datos);
  if (!analizado.success) {
    return { ok: false, error: analizado.error.issues[0]?.message ?? "Escribe un correo válido" };
  }

  // Sin limite, el formulario sirve para inundar de correos a cualquiera.
  const porIp = limites.recuperacionPorIp.consumir(await ipDelCliente());
  if (!porIp.permitido) return { ok: false, error: mensajeDeEspera(porIp.reintentarEnMs) };
  const porCorreo = limites.recuperacionPorCorreo.consumir(analizado.data.email);
  if (!porCorreo.permitido) return { ok: false, error: mensajeDeEspera(porCorreo.reintentarEnMs) };

  const usuario = await prisma.usuario.findUnique({
    where: { email: analizado.data.email },
    select: { id: true, nombre: true, email: true, clave: true, activo: true },
  });

  if (usuario?.activo) {
    const token = crearTokenRecuperacion(usuario.id, usuario.clave, secretoSesion());
    const enlace = `${URL_TIENDA}/recuperar-clave/nueva?token=${encodeURIComponent(token)}`;
    const { asunto, cuerpo } = correoRecuperacion({ nombre: usuario.nombre, enlace });
    await enviarCorreo(usuario.email, asunto, cuerpo);
  }

  return { ok: true };
}

/** Guarda la clave nueva si el enlace es valido. Despues el enlace ya no sirve. */
export async function restablecerClave(datos: unknown): Promise<ResultadoRecuperacion> {
  const analizado = esquemaNuevaClave.safeParse(datos);
  if (!analizado.success) {
    return { ok: false, error: analizado.error.issues[0]?.message ?? "Revisa la contraseña" };
  }

  const vencido = "El enlace venció o ya se usó. Pide uno nuevo.";
  const { token, clave } = analizado.data;

  const usuarioId = usuarioDeTokenRecuperacion(token);
  if (usuarioId === null) return { ok: false, error: vencido };

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, clave: true, activo: true },
  });
  if (usuario === null || !usuario.activo) return { ok: false, error: vencido };
  if (!verificarTokenRecuperacion(token, usuario.clave, secretoSesion())) {
    return { ok: false, error: vencido };
  }

  await prisma.usuario.update({ where: { id: usuario.id }, data: { clave: hashClave(clave) } });
  return { ok: true };
}
