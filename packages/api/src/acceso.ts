/**
 * Ingreso, registro y recuperacion de clave.
 *
 * Las reglas viven aqui una sola vez: la tienda web las llama desde sus server
 * actions (y guarda el resultado en una cookie) y la app movil desde tRPC (y
 * guarda el token en el celular). Ninguna de las dos decide si una clave vale,
 * cuantos intentos quedan o que se le responde a quien prueba correos.
 */

import {
  type CargaSesion,
  correoRecuperacion,
  crearTokenRecuperacion,
  hashClave,
  mensajeDeEspera,
  nombreDesdeCorreo,
  usuarioDeTokenRecuperacion,
  verificarClave,
  verificarTokenRecuperacion,
} from "@appweb/core";
import {
  esquemaAutorregistro,
  esquemaIngreso,
  esquemaNuevaClave,
  esquemaRecuperacion,
} from "@appweb/core/tipos";
import { prisma } from "@appweb/db";

import { enviarCorreo } from "./correo";
import { limites } from "./limites";
import { secretoSesion } from "./sesion";
import { URL_TIENDA } from "./urls";

/** Vida de la sesion con "Recordarme" (y siempre en la app movil). */
export const DURACION_SESION_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias
/** Sin "Recordarme": un dia, y en la web la cookie muere al cerrar el navegador. */
export const DURACION_SESION_CORTA_MS = 1000 * 60 * 60 * 24;

export type ResultadoAcceso =
  | { ok: true; carga: CargaSesion; recordar: boolean }
  | { ok: false; error: string };

export type ResultadoSimple = { ok: true } | { ok: false; error: string };

/** Mismo mensaje si el correo no existe o si la clave no coincide. */
const INCORRECTO = "Correo o contraseña incorrectos";

export async function ingresar(datos: unknown, ip: string): Promise<ResultadoAcceso> {
  const analizado = esquemaIngreso.safeParse(datos);
  if (!analizado.success) return { ok: false, error: INCORRECTO };

  const { email, clave, recordar } = analizado.data;

  // Dos cuentas: por IP (cualquier intento) y por correo (solo los fallidos,
  // y se borra al acertar). Asi un cliente que olvido la clave no bloquea a
  // nadie mas, y quien prueba claves contra una cuenta se frena a los cinco.
  const porIp = limites.ingresoPorIp.consumir(ip);
  if (!porIp.permitido) return { ok: false, error: mensajeDeEspera(porIp.reintentarEnMs) };
  const porCorreo = limites.ingresoPorCorreo.revisar(email);
  if (!porCorreo.permitido) return { ok: false, error: mensajeDeEspera(porCorreo.reintentarEnMs) };

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Decir cual de las dos fallo es regalarle a quien prueba correos al azar
  // cuales si estan registrados.
  if (usuario === null || !usuario.activo || !verificarClave(clave, usuario.clave)) {
    limites.ingresoPorCorreo.registrar(email);
    return { ok: false, error: INCORRECTO };
  }
  limites.ingresoPorCorreo.limpiar(email);

  // `editadoEn` se pasa tal cual: entrar no es editar el perfil, y sin esto
  // @updatedAt lo moveria en cada inicio de sesion.
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAccesoEn: new Date(), editadoEn: usuario.editadoEn },
  });

  return {
    ok: true,
    carga: { usuarioId: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    recordar,
  };
}

export async function registrar(datos: unknown, ip: string): Promise<ResultadoAcceso> {
  const analizado = esquemaAutorregistro.safeParse(datos);
  if (!analizado.success) {
    return { ok: false, error: analizado.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const cupo = limites.registroPorIp.consumir(ip);
  if (!cupo.permitido) return { ok: false, error: mensajeDeEspera(cupo.reintentarEnMs) };

  const { email, clave, telefono } = analizado.data;

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente !== null) return { ok: false, error: "Ya existe una cuenta con ese correo." };

  const usuario = await prisma.usuario.create({
    data: {
      nombre: nombreDesdeCorreo(email),
      email,
      clave: hashClave(clave),
      telefono: telefono ?? null,
      // El registro deja la sesion iniciada: ese es su primer acceso.
      ultimoAccesoEn: new Date(),
    },
  });

  return {
    ok: true,
    carga: { usuarioId: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    recordar: true,
  };
}

/**
 * Manda el enlace. Responde lo mismo exista o no la cuenta: decir "ese correo
 * no esta registrado" es regalarle a cualquiera la lista de clientes.
 */
export async function pedirRecuperacion(datos: unknown, ip: string): Promise<ResultadoSimple> {
  const analizado = esquemaRecuperacion.safeParse(datos);
  if (!analizado.success) {
    return { ok: false, error: analizado.error.issues[0]?.message ?? "Escribe un correo válido" };
  }

  // Sin limite, el formulario sirve para inundar de correos a cualquiera.
  const porIp = limites.recuperacionPorIp.consumir(ip);
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
export async function restablecerClave(datos: unknown): Promise<ResultadoSimple> {
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
