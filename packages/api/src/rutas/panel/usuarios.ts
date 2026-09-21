/**
 * Usuarios del panel: alta de cuentas y cambio de rol.
 *
 * Todo pasa por `exige("gestionar_usuarios")`, asi que quien no tenga ese
 * permiso recibe FORBIDDEN aunque llame a la ruta directamente — esconder el
 * boton en el panel no es seguridad.
 *
 * Las dos reglas que protegen el acceso (nadie se toca a si mismo, siempre
 * queda un ADMIN activo) las decide @appweb/core, no esta ruta.
 */

import { TRPCError } from "@trpc/server";

import {
  hashClave,
  mensajeDeRechazo,
  revisarCambioRol,
  revisarDesactivacion,
  type Rol,
} from "@appweb/core";
import {
  esquemaCambioActivo,
  esquemaCambioRol,
  esquemaUsuarioPanel,
} from "@appweb/core/tipos";

import { exige, router } from "../../trpc";

const gestionar = exige("gestionar_usuarios");

/** Lo que el panel pinta de cada cuenta. Nunca incluye `clave`. */
const SELECCION = {
  id: true,
  email: true,
  nombre: true,
  telefono: true,
  rol: true,
  activo: true,
  creadoEn: true,
} as const;

export const usuarios = router({
  /**
   * Todas las cuentas, hasta 200. No recibe busqueda a proposito: el panel
   * filtra sobre esta lista en el cliente, sin volver al servidor por cada
   * tecla. Cuando la tienda pase de 200 cuentas hara falta paginar, y ese es
   * el momento de que la busqueda viva aqui.
   */
  listar: gestionar.query(async ({ ctx }) => {
    return ctx.prisma.usuario.findMany({
      orderBy: [{ creadoEn: "desc" }],
      take: 200,
      select: SELECCION,
    });
  }),

  crear: gestionar.input(esquemaUsuarioPanel).mutation(async ({ ctx, input }) => {
    const existente = await ctx.prisma.usuario.findUnique({ where: { email: input.email } });
    if (existente !== null) {
      throw new TRPCError({ code: "CONFLICT", message: "Ya existe una cuenta con ese correo." });
    }

    return ctx.prisma.usuario.create({
      data: {
        nombre: input.nombre,
        email: input.email,
        clave: hashClave(input.clave),
        telefono: input.telefono ?? null,
        rol: input.rol,
      },
      select: SELECCION,
    });
  }),

  cambiarRol: gestionar.input(esquemaCambioRol).mutation(async ({ ctx, input }) => {
    const objetivo = await ctx.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: { id: true, rol: true },
    });
    if (objetivo === null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Esa cuenta no existe." });
    }

    const adminsActivos = await ctx.prisma.usuario.count({
      where: { rol: "ADMIN", activo: true },
    });

    const rechazo = revisarCambioRol({
      actorId: ctx.sesion.usuarioId,
      objetivoId: objetivo.id,
      rolActual: objetivo.rol as Rol,
      rolNuevo: input.rol,
      adminsActivos,
    });
    if (rechazo !== null) {
      throw new TRPCError({ code: "BAD_REQUEST", message: mensajeDeRechazo(rechazo) });
    }

    return ctx.prisma.usuario.update({
      where: { id: objetivo.id },
      data: { rol: input.rol },
      select: SELECCION,
    });
  }),

  /** Las cuentas se desactivan, no se borran: sus pedidos siguen existiendo. */
  cambiarActivo: gestionar.input(esquemaCambioActivo).mutation(async ({ ctx, input }) => {
    const objetivo = await ctx.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: { id: true, rol: true },
    });
    if (objetivo === null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Esa cuenta no existe." });
    }

    if (!input.activo) {
      const adminsActivos = await ctx.prisma.usuario.count({
        where: { rol: "ADMIN", activo: true },
      });

      const rechazo = revisarDesactivacion({
        actorId: ctx.sesion.usuarioId,
        objetivoId: objetivo.id,
        rolActual: objetivo.rol as Rol,
        adminsActivos,
      });
      if (rechazo !== null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: mensajeDeRechazo(rechazo) });
      }
    }

    return ctx.prisma.usuario.update({
      where: { id: objetivo.id },
      data: { activo: input.activo },
      select: SELECCION,
    });
  }),
});
