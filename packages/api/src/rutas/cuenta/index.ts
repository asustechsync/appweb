/**
 * La cuenta del cliente: sus pedidos, sus direcciones y sus datos.
 *
 * Todo `privado`: cada procedimiento trabaja SIEMPRE sobre
 * `ctx.sesion.usuarioId` y nunca sobre un id que llegue de fuera. Por eso no
 * hay forma de pedir el pedido de otra persona — no existe el parametro.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  ESTADOS_QUE_HABILITAN_RESENA,
  hashClave,
  mensajeDeRechazoResena,
  REQUISITOS_CLAVE,
  revisarResena,
  urlDeFoto,
  verificarClave,
  type EstadoResena,
} from "@appweb/core";
import { esquemaDireccion, esquemaPerfil, esquemaResena } from "@appweb/core/tipos";
import { Prisma } from "@appweb/db";

import { nivelDeUsuario, nivelesVigentes } from "../../clientes";
import { privado, router } from "../../trpc";

const esquemaClave = z.object({
  claveActual: z.string().min(1, "Escribe tu clave actual"),
  claveNueva: z
    .string()
    .max(72, "La clave nueva es demasiado larga")
    .refine(
      (c) => REQUISITOS_CLAVE.every((r) => r.cumple(c)),
      "La clave nueva no cumple los requisitos",
    ),
});

export const cuenta = router({
  // ── Datos ────────────────────────────────────────────────────────────────

  perfil: privado.query(async ({ ctx }) => {
    const usuario = await ctx.prisma.usuario.findUnique({
      where: { id: ctx.sesion.usuarioId },
      select: {
        nombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        apodo: true,
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
        apellidoPaterno: input.apellidoPaterno ?? null,
        apellidoMaterno: input.apellidoMaterno ?? null,
        apodo: input.apodo ?? null,
        telefono: input.telefono ?? null,
        tipoDocumento: input.tipoDocumento ?? null,
        numeroDocumento: input.numeroDocumento ?? null,
        fechaNacimiento: input.fechaNacimiento ? new Date(input.fechaNacimiento) : null,
        genero: input.genero ?? null,
      },
      select: {
        nombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        apodo: true,
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

  /** Nivel de recompensa: en cual esta, cuanto lleva y cuanto le falta. */
  nivel: privado.query(async ({ ctx }) => {
    const [estado, niveles] = await Promise.all([
      nivelDeUsuario(ctx.prisma, ctx.sesion.usuarioId),
      nivelesVigentes(ctx.prisma),
    ]);
    return { ...estado, niveles };
  }),

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
        items: {
          take: 1,
          select: {
            nombreProducto: true,
            variante: {
              select: {
                producto: {
                  select: {
                    imagenes: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return pedidos.map((pedido) => ({
      codigo: pedido.codigo,
      estado: pedido.estado,
      total: Number(pedido.total),
      creadoEn: pedido.creadoEn,
      envioMetodo: pedido.envioMetodo,
      lineas: pedido._count.items,
      primerProducto: pedido.items[0]?.nombreProducto ?? null,
      imagen: urlDeFoto(pedido.items[0]?.variante.producto.imagenes[0]?.url),
    }));
  }),

  /** Detalle de un pedido propio. `codigo` de otra persona devuelve NOT_FOUND. */
  pedido: privado.input(z.object({ codigo: z.string().min(1) })).query(async ({ ctx, input }) => {
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

  // ── Reseñas ──────────────────────────────────────────────────────────────

  /**
   * Productos que el cliente ya recibio, el mas reciente arriba, con la
   * reseña que dejo de cada uno (o `null` si aun no opina).
   */
  porResenar: privado.query(async ({ ctx }) => {
    const [items, resenas] = await Promise.all([
      ctx.prisma.itemPedido.findMany({
        where: {
          pedido: {
            usuarioId: ctx.sesion.usuarioId,
            estado: { in: [...ESTADOS_QUE_HABILITAN_RESENA] },
          },
          variante: { producto: { activo: true } },
        },
        orderBy: { pedido: { creadoEn: "desc" } },
        take: 200,
        select: {
          variante: {
            select: {
              producto: {
                select: {
                  id: true,
                  slug: true,
                  nombre: true,
                  imagenes: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      }),
      ctx.prisma.resena.findMany({
        where: { usuarioId: ctx.sesion.usuarioId },
        select: { productoId: true, estrellas: true, comentario: true, estado: true },
      }),
    ]);

    const porProducto = new Map(resenas.map((r) => [r.productoId, r]));
    const vistos = new Set<string>();
    const productos = [];
    for (const { variante } of items) {
      const p = variante.producto;
      if (vistos.has(p.id)) continue;
      vistos.add(p.id);
      const resena = porProducto.get(p.id);
      productos.push({
        productoId: p.id,
        slug: p.slug,
        nombre: p.nombre,
        imagenUrl: urlDeFoto(p.imagenes[0]?.url),
        resena: resena
          ? {
              estrellas: resena.estrellas,
              comentario: resena.comentario,
              estado: resena.estado as EstadoResena,
            }
          : null,
      });
    }
    return productos;
  }),

  /**
   * Escribe o reescribe la reseña de un producto recibido. Vuelve a quedar en
   * revision: lo que se publica siempre paso por el panel.
   */
  guardarResena: privado.input(esquemaResena).mutation(async ({ ctx, input }) => {
    const usuarioId = ctx.sesion.usuarioId;
    const [compras, actual] = await Promise.all([
      ctx.prisma.itemPedido.count({
        where: {
          pedido: { usuarioId, estado: { in: [...ESTADOS_QUE_HABILITAN_RESENA] } },
          variante: { productoId: input.productoId },
        },
      }),
      ctx.prisma.resena.findUnique({
        where: { usuarioId_productoId: { usuarioId, productoId: input.productoId } },
        select: { estado: true },
      }),
    ]);

    const rechazo = revisarResena({
      compro: compras > 0,
      estadoActual: (actual?.estado as EstadoResena | undefined) ?? null,
    });
    if (rechazo) {
      throw new TRPCError({
        code: rechazo === "sin_compra" ? "FORBIDDEN" : "CONFLICT",
        message: mensajeDeRechazoResena(rechazo),
      });
    }

    const datos = {
      estrellas: input.estrellas,
      comentario: input.comentario ? input.comentario : null,
      estado: "PENDIENTE" as const,
      moderadoPorId: null,
      moderadoEn: null,
    };

    if (actual === null) {
      try {
        await ctx.prisma.resena.create({
          data: { ...datos, usuarioId, productoId: input.productoId },
        });
      } catch (error) {
        // Doble envio: la otra peticion ya creo la reseña.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new TRPCError({ code: "CONFLICT", message: "Ya guardamos tu reseña." });
        }
        throw error;
      }
    } else {
      // Con el estado en el filtro: si el panel la publico entre la lectura y
      // esta escritura, no se reescribe una reseña ya publicada.
      const { count } = await ctx.prisma.resena.updateMany({
        where: { usuarioId, productoId: input.productoId, estado: { not: "APROBADA" } },
        data: datos,
      });
      if (count === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: mensajeDeRechazoResena("ya_publicada"),
        });
      }
    }

    return { ok: true };
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
