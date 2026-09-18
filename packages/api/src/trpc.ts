/**
 * Base de tRPC: contexto y procedimientos con su nivel de acceso.
 *
 * Aqui se comprueba el rol, no en cada pantalla. Un procedimiento protegido
 * cubre la web, el panel y la app movil a la vez — esconder un boton en el
 * panel no es seguridad.
 */

import { initTRPC, TRPCError } from "@trpc/server";

import { puede, type Accion, type Rol } from "@appweb/core";
import { prisma } from "@appweb/db";

export interface Sesion {
  usuarioId: string;
  rol: Rol;
}

export interface Contexto {
  prisma: typeof prisma;
  sesion: Sesion | null;
}

export function crearContexto(sesion: Sesion | null): Contexto {
  return { prisma, sesion };
}

const t = initTRPC.context<Contexto>().create();

export const router = t.router;

/** Abierto: catalogo y cualquier lectura publica. */
export const publico = t.procedure;

/** Exige sesion iniciada. */
export const privado = t.procedure.use(({ ctx, next }) => {
  if (!ctx.sesion) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Inicia sesion" });
  }
  return next({ ctx: { ...ctx, sesion: ctx.sesion } });
});

/** Exige sesion y una accion concreta permitida para su rol. */
export function exige(accion: Accion) {
  return privado.use(({ ctx, next }) => {
    if (!puede(ctx.sesion.rol, accion)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso" });
    }
    return next({ ctx });
  });
}
