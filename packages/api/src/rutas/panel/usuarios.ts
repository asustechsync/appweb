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

import { randomBytes } from "node:crypto";

import { TRPCError } from "@trpc/server";

import {
  datosAnonimos,
  estaAnonimizada,
  hashClave,
  mensajeDeRechazo,
  revisarCambioRol,
  revisarDesactivacion,
  type Rol,
} from "@appweb/core";
import {
  esquemaCambioActivo,
  esquemaCambioRol,
  esquemaClavePanel,
  esquemaEdicionUsuario,
  esquemaIdUsuario,
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
      select: { id: true, rol: true, email: true },
    });
    if (objetivo === null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Esa cuenta no existe." });
    }
    if (estaAnonimizada(objetivo.email)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Esta cuenta fue eliminada." });
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
      select: { id: true, rol: true, email: true },
    });
    if (objetivo === null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Esa cuenta no existe." });
    }
    if (estaAnonimizada(objetivo.email)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Esta cuenta fue eliminada." });
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

  /** Ficha de una cuenta: contacto, perfil y sus ultimos pedidos. */
  detalle: gestionar.input(esquemaIdUsuario).query(async ({ ctx, input }) => {
    const u = await ctx.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: {
        ...SELECCION,
        ultimoAccesoEn: true,
        numeroDocumento: true,
        _count: { select: { pedidos: true, direcciones: true } },
        pedidos: {
          orderBy: { creadoEn: "desc" },
          take: 10,
          select: { id: true, codigo: true, estado: true, total: true, creadoEn: true },
        },
      },
    });
    if (u === null) throw new TRPCError({ code: "NOT_FOUND", message: "Esa cuenta no existe." });

    const comprado = await ctx.prisma.pedido.aggregate({
      where: { usuarioId: u.id, estado: { in: ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"] } },
      _sum: { total: true },
    });

    return {
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      telefono: u.telefono,
      rol: u.rol,
      activo: u.activo,
      anonimizada: estaAnonimizada(u.email),
      creadoEn: u.creadoEn.toISOString(),
      ultimoAccesoEn: u.ultimoAccesoEn?.toISOString() ?? null,
      tieneDocumento: u.numeroDocumento !== null,
      totalPedidos: u._count.pedidos,
      direcciones: u._count.direcciones,
      totalComprado: Number(comprado._sum.total ?? 0),
      pedidos: u.pedidos.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        estado: p.estado,
        total: Number(p.total),
        creadoEn: p.creadoEn.toISOString(),
      })),
    };
  }),

  /** Corrige nombre, correo y telefono. El correo sigue siendo unico. */
  editar: gestionar.input(esquemaEdicionUsuario).mutation(async ({ ctx, input }) => {
    const objetivo = await ctx.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: { email: true },
    });
    if (objetivo === null)
      throw new TRPCError({ code: "NOT_FOUND", message: "Esa cuenta no existe." });
    if (estaAnonimizada(objetivo.email)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Esta cuenta fue eliminada." });
    }

    const otro = await ctx.prisma.usuario.findFirst({
      where: { email: input.email, NOT: { id: input.usuarioId } },
      select: { id: true },
    });
    if (otro !== null) {
      throw new TRPCError({ code: "CONFLICT", message: "Ya existe otra cuenta con ese correo." });
    }

    return ctx.prisma.usuario.update({
      where: { id: input.usuarioId },
      data: { nombre: input.nombre, email: input.email, telefono: input.telefono },
      select: SELECCION,
    });
  }),

  /**
   * Pone una clave nueva (por ejemplo, para alguien del equipo que la olvido).
   * La persona la cambia despues desde su cuenta. Nadie se la pone a si mismo
   * desde aqui: para eso esta su cuenta.
   */
  ponerClave: gestionar.input(esquemaClavePanel).mutation(async ({ ctx, input }) => {
    if (input.usuarioId === ctx.sesion.usuarioId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: mensajeDeRechazo("es_uno_mismo") });
    }
    const objetivo = await ctx.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: { email: true },
    });
    if (objetivo === null)
      throw new TRPCError({ code: "NOT_FOUND", message: "Esa cuenta no existe." });
    if (estaAnonimizada(objetivo.email)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Esta cuenta fue eliminada." });
    }

    await ctx.prisma.usuario.update({
      where: { id: input.usuarioId },
      data: { clave: hashClave(input.clave) },
    });
    return { ok: true };
  }),

  /**
   * "Eliminar" = anonimizar (ver `datosAnonimos`): se borran sus datos
   * personales y sus direcciones; sus pedidos quedan, sin nombre. No se
   * deshace. Pasa las mismas reglas que desactivar.
   */
  anonimizar: gestionar.input(esquemaIdUsuario).mutation(async ({ ctx, input }) => {
    const objetivo = await ctx.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: { id: true, rol: true, email: true },
    });
    if (objetivo === null)
      throw new TRPCError({ code: "NOT_FOUND", message: "Esa cuenta no existe." });
    if (estaAnonimizada(objetivo.email)) return { ok: true };

    const adminsActivos = await ctx.prisma.usuario.count({ where: { rol: "ADMIN", activo: true } });
    const rechazo = revisarDesactivacion({
      actorId: ctx.sesion.usuarioId,
      objetivoId: objetivo.id,
      rolActual: objetivo.rol as Rol,
      adminsActivos,
    });
    if (rechazo !== null) {
      throw new TRPCError({ code: "BAD_REQUEST", message: mensajeDeRechazo(rechazo) });
    }

    const claveInutil = hashClave(randomBytes(32).toString("hex"));
    await ctx.prisma.$transaction([
      ctx.prisma.direccion.deleteMany({ where: { usuarioId: objetivo.id } }),
      ctx.prisma.usuario.update({
        where: { id: objetivo.id },
        data: { ...datosAnonimos(objetivo.id, claveInutil), rol: "CLIENTE" },
      }),
    ]);
    return { ok: true };
  }),
});
