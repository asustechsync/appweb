/**
 * El catalogo publico: lo que la app movil lee sin sesion.
 *
 * Todo `publico`. Las lecturas llegan por `ctx.catalogo`: la tienda web pasa
 * sus funciones cacheadas, asi una visita de la app no toca la base mientras
 * la cache siga viva.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { filtrosDesdeUrl, ORDENES, ordenarPorPrecio, terminosDeBusqueda } from "@appweb/core";

import { publico, router } from "../../trpc";

export const catalogo = router({
  /** Todo lo que pinta la portada de la app, en una sola peticion. */
  portada: publico.query(async ({ ctx }) => {
    const [banners, categorias, ofertas, novedades] = await Promise.all([
      ctx.catalogo.banners(),
      ctx.catalogo.categorias(),
      ctx.catalogo.ofertas(10),
      ctx.catalogo.novedades(10),
    ]);
    return { banners, categorias, ofertas, novedades };
  }),

  /** Los productos mas recientes, para la portada de la app. */
  novedades: publico
    .input(z.object({ limite: z.number().int().min(1).max(20).default(10) }).optional())
    .query(({ ctx, input }) => ctx.catalogo.novedades(input?.limite ?? 10)),

  /** La ficha de un producto. Si no existe o esta oculto, NOT_FOUND. */
  ficha: publico.input(z.object({ slug: z.string().min(1) })).query(async ({ ctx, input }) => {
    const producto = await ctx.catalogo.ficha(input.slug);
    if (!producto) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Este producto ya no está disponible." });
    }
    return producto;
  }),

  /**
   * Las lineas del carrito guardado en el celular, con precio y stock de hoy.
   * Las variantes que ya no existen vuelven fuera: la app las descarta.
   */
  lineas: publico
    .input(z.object({ varianteIds: z.array(z.string().min(1)).max(50) }))
    .query(async ({ ctx, input }) => {
      const variantes = await Promise.all(
        [...new Set(input.varianteIds)].map((id) => ctx.catalogo.variante(id)),
      );
      return variantes.filter((v) => v !== null);
    }),

  /**
   * Listado de una categoria con filtros. Los filtros llegan con la misma forma
   * que en la URL de la web (`talla`, `orden`...) y los valida `filtrosDesdeUrl`
   * de @appweb/core: un valor raro se descarta, nunca llega crudo a la base.
   */
  listado: publico
    .input(
      z.object({
        categoria: z.string().min(1),
        filtros: z.record(z.string(), z.string()).default({}),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filtros = filtrosDesdeUrl(input.filtros);
      const [categoria, facetas, productos] = await Promise.all([
        ctx.catalogo.categoria(input.categoria),
        ctx.catalogo.facetas(input.categoria),
        ctx.catalogo.listado(input.categoria, filtros),
      ]);
      if (!categoria) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Esta categoría ya no está disponible.",
        });
      }
      return { categoria, facetas, filtros, productos };
    }),

  /** Busqueda por palabras: nombre, marca o categoria. */
  buscar: publico
    .input(z.object({ texto: z.string().max(100), orden: z.enum(ORDENES).default("novedades") }))
    .query(async ({ ctx, input }) => {
      const terminos = terminosDeBusqueda(input.texto);
      return ordenarPorPrecio(await ctx.catalogo.busqueda(terminos), input.orden);
    }),

  /** La pagina de una marca con sus productos. */
  marca: publico.input(z.object({ slug: z.string().min(1) })).query(async ({ ctx, input }) => {
    const marca = await ctx.catalogo.marca(input.slug);
    if (!marca) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Esta marca ya no está disponible." });
    }
    return marca;
  }),

  /** Tarjetas de los productos guardados como favoritos en el celular. */
  productos: publico
    .input(z.object({ slugs: z.array(z.string().min(1)).max(100) }))
    .query(({ ctx, input }) => ctx.catalogo.porSlugs([...new Set(input.slugs)])),
});
