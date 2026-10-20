/**
 * Reseñas en el panel: la cola de moderacion y la decision.
 *
 * El cliente escribe la reseña desde su cuenta y aqui no se edita: solo se
 * publica o no. La nota de la tienda cambia cuando una reseña entra o sale de
 * las publicadas, asi que cada decision devuelve el producto a regenerar.
 */

import { TRPCError } from "@trpc/server";

import { autorDeResena, ESTADOS_RESENA, type EstadoResena } from "@appweb/core";
import { esquemaFiltroResenas, esquemaModeracionResena } from "@appweb/core/tipos";

import { exige, router } from "../../trpc";

const moderar = exige("moderar_resenas");

export const resenas = router({
  /** Pendientes, la mas vieja arriba (la que mas espera); el resto, la ultima arriba. */
  listar: moderar.input(esquemaFiltroResenas).query(async ({ ctx, input }) => {
    const [filas, conteo] = await Promise.all([
      ctx.prisma.resena.findMany({
        where: input.estado ? { estado: input.estado } : {},
        orderBy: { creadoEn: input.estado === "PENDIENTE" ? "asc" : "desc" },
        take: 200,
        select: {
          id: true,
          estrellas: true,
          comentario: true,
          estado: true,
          creadoEn: true,
          moderadoEn: true,
          producto: { select: { nombre: true, slug: true } },
          usuario: { select: { nombre: true, apellidoPaterno: true, email: true } },
          moderadoPor: { select: { nombre: true } },
        },
      }),
      ctx.prisma.resena.groupBy({ by: ["estado"], _count: { _all: true } }),
    ]);

    const porEstado = Object.fromEntries(ESTADOS_RESENA.map((e) => [e, 0])) as Record<
      EstadoResena,
      number
    >;
    for (const fila of conteo) porEstado[fila.estado as EstadoResena] = fila._count._all;

    return {
      porEstado,
      resenas: filas.map((r) => ({
        id: r.id,
        estrellas: r.estrellas,
        comentario: r.comentario,
        estado: r.estado as EstadoResena,
        creadoEn: r.creadoEn.toISOString(),
        producto: r.producto.nombre,
        productoSlug: r.producto.slug,
        autor: autorDeResena(r.usuario),
        email: r.usuario.email,
        moderadoPor: r.moderadoPor?.nombre ?? null,
        moderadoEn: r.moderadoEn?.toISOString() ?? null,
      })),
    };
  }),

  /** Publica o retira una reseña. Se puede cambiar de opinion despues. */
  moderar: moderar.input(esquemaModeracionResena).mutation(async ({ ctx, input }) => {
    const resena = await ctx.prisma.resena.findUnique({
      where: { id: input.resenaId },
      select: {
        id: true,
        estado: true,
        producto: { select: { slug: true, categoria: { select: { slug: true } } } },
      },
    });
    if (resena === null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Esa reseña no existe." });
    }

    await ctx.prisma.resena.update({
      where: { id: resena.id },
      data: {
        estado: input.estado,
        moderadoPorId: ctx.sesion.usuarioId,
        moderadoEn: new Date(),
      },
    });

    // Solo cambia lo que ve la tienda si la reseña entra o sale de las publicadas.
    const cambiaLaTienda = resena.estado === "APROBADA" || input.estado === "APROBADA";
    return {
      revalidar: {
        productos: cambiaLaTienda
          ? [{ slug: resena.producto.slug, slugCategoria: resena.producto.categoria.slug }]
          : [],
      },
    };
  }),
});
