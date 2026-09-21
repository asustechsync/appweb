/**
 * La cuenta del cliente: sus pedidos, sus direcciones y sus datos.
 *
 * Todo `privado`: cada procedimiento trabaja SIEMPRE sobre
 * `ctx.sesion.usuarioId` y nunca sobre un id que llegue de fuera. Por eso no
 * hay forma de pedir el pedido de otra persona — no existe el parametro.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hashClave, verificarClave } from "@appweb/core";
import { esquemaDireccion, esquemaPerfil } from "@appweb/core/tipos";

import { privado, router } from "../../trpc";

const esquemaClave = z.object({
  claveActual: z.string().min(1, "Escribe tu clave actual"),
  claveNueva: z.string().min(8, "Minimo 8 caracteres").max(72),
});

export const cuenta = router({
  // ── Datos ────────────────────────────────────────────────────────────────

  perfil: privado.query(async ({ ctx }) => {
    const usuario = await ctx.prisma.usuario.findUnique({
      where: { id: ctx.sesion.usuarioId },
      select: {
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        tipoDocumento: true,
        numeroDocumento: true,
        fechaNacimiento: true,
        genero: true,
        rol: true,
      },
    });

    if (usuario === null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tu cuenta no existe." });
    }

    return {
      ...usuario,
      // Solo la fecha (YYYY-MM-DD): la hora no significa nada aqui y solo
      // complica el <input type="date"> que la muestra.
      fechaNacimiento: usuario.fechaNacimiento?.toISOString().slice(0, 10) ?? null,
    };
  }),

  guardarDatos: privado.input(esquemaPerfil).mutation(async ({ ctx, input }) => {
    const usuario = await ctx.prisma.usuario.update({
      where: { id: ctx.sesion.usuarioId },
      data: {
        nombre: input.nombre,
        apellido: input.apellido ?? null,
        telefono: input.telefono ?? null,
        tipoDocumento: input.tipoDocumento ?? null,
        numeroDocumento: input.numeroDocumento ?? null,
        fechaNacimiento: input.fechaNacimiento ? new Date(input.fechaNacimiento) : null,
        genero: input.genero ?? null,
      },
      select: {
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        tipoDocumento: true,
        numeroDocumento: true,
        fechaNacimiento: true,
        genero: true,
        rol: true,
      },
    });

    return {
      ...usuario,
      fechaNacimiento: usuario.fechaNacimiento?.toISOString().slice(0, 10) ?? null,
    };
  }),

  cambiarClave: privado.input(esquemaClave).mutation(async ({ ctx, input }) => {
    const usuario = await ctx.prisma.usuario.findUnique({
      where: { id: ctx.sesion.usuarioId },
      select: { clave: true },
    });

    if (usuario === null || !verificarClave(input.claveActual, usuario.clave)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Tu clave actual no coincide." });
    }

    await ctx.prisma.usuario.update({
      where: { id: ctx.sesion.usuarioId },
      data: { clave: hashClave(input.claveNueva) },
    });

    return { ok: true };
  }),

  // ── Pedidos ──────────────────────────────────────────────────────────────

  pedidos: privado.query(async ({ ctx }) => {
    const pedidos = await ctx.prisma.pedido.findMany({
      where: { usuarioId: ctx.sesion.usuarioId },
      orderBy: { creadoEn: "desc" },
      take: 50,
      select: {
        codigo: true,
        estado: true,
        total: true,
        creadoEn: true,
        envioMetodo: true,
        _count: { select: { items: true } },
      },
    });

    return pedidos.map((pedido) => ({
      codigo: pedido.codigo,
      estado: pedido.estado,
      total: Number(pedido.total),
      creadoEn: pedido.creadoEn,
      envioMetodo: pedido.envioMetodo,
      lineas: pedido._count.items,
    }));
  }),

  /** Detalle de un pedido propio. `codigo` de otra persona devuelve NOT_FOUND. */
  pedido: privado
    .input(z.object({ codigo: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const pedido = await ctx.prisma.pedido.findFirst({
        where: { codigo: input.codigo, usuarioId: ctx.sesion.usuarioId },
        include: { items: true },
      });

      if (pedido === null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ese pedido no existe." });
      }

      return {
        codigo: pedido.codigo,
        estado: pedido.estado,
        subtotal: Number(pedido.subtotal),
        descuento: Number(pedido.descuento),
        costoEnvio: Number(pedido.costoEnvio),
        total: Number(pedido.total),
        creadoEn: pedido.creadoEn,
        envioMetodo: pedido.envioMetodo,
        envioDepartamento: pedido.envioDepartamento,
        envioProvincia: pedido.envioProvincia,
        envioDistrito: pedido.envioDistrito,
        envioCalle: pedido.envioCalle,
        envioReferencia: pedido.envioReferencia,
        comprobante: pedido.comprobante,
        documento: pedido.documento,
        items: pedido.items.map((item) => ({
          nombreProducto: item.nombreProducto,
          talla: item.talla,
          color: item.color,
          precioUnitario: Number(item.precioUnitario),
          cantidad: item.cantidad,
        })),
      };
    }),

  // ── Direcciones ──────────────────────────────────────────────────────────

  direcciones: privado.query(async ({ ctx }) => {
    return ctx.prisma.direccion.findMany({
      where: { usuarioId: ctx.sesion.usuarioId },
      orderBy: [{ principal: "desc" }],
      select: {
        id: true,
        departamento: true,
        provincia: true,
        distrito: true,
        calle: true,
        referencia: true,
        principal: true,
      },
    });
  }),

  crearDireccion: privado.input(esquemaDireccion).mutation(async ({ ctx, input }) => {
    const { referencia, principal, ...resto } = input;

    // Solo una direccion puede ser la principal: si esta lo es, las demas
    // dejan de serlo en la misma transaccion.
    return ctx.prisma.$transaction(async (tx) => {
      if (principal) {
        await tx.direccion.updateMany({
          where: { usuarioId: ctx.sesion.usuarioId },
          data: { principal: false },
        });
      }

      return tx.direccion.create({
        data: {
          ...resto,
          referencia: referencia ?? null,
          principal,
          usuarioId: ctx.sesion.usuarioId,
        },
        select: { id: true },
      });
    });
  }),

  marcarPrincipal: privado
    .input(z.object({ direccionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const propia = await ctx.prisma.direccion.findFirst({
        where: { id: input.direccionId, usuarioId: ctx.sesion.usuarioId },
        select: { id: true },
      });
      if (propia === null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Esa dirección no existe." });
      }

      return ctx.prisma.$transaction(async (tx) => {
        await tx.direccion.updateMany({
          where: { usuarioId: ctx.sesion.usuarioId },
          data: { principal: false },
        });
        return tx.direccion.update({
          where: { id: propia.id },
          data: { principal: true },
          select: { id: true },
        });
      });
    }),

  eliminarDireccion: privado
    .input(z.object({ direccionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // `deleteMany` con el usuarioId en el where: si la direccion es de otra
      // persona no borra nada en vez de borrar lo que no debe.
      const borradas = await ctx.prisma.direccion.deleteMany({
        where: { id: input.direccionId, usuarioId: ctx.sesion.usuarioId },
      });

      if (borradas.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Esa dirección no existe." });
      }

      return { ok: true };
    }),
});
