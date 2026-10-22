/**
 * Categorias y marcas del panel: lista, alta y edicion.
 *
 * No se borran: una categoria o marca con productos vendidos se oculta
 * (`activo`), igual que un producto. Asi ninguna ficha queda huerfana y las
 * URLs viejas responden 404 en vez de romper la tienda.
 *
 * Cada escritura dice que regenerar en la tienda: el menu (`navegacion`)
 * cuando cambia el arbol de categorias, y el catalogo y la portada siempre.
 */

import { TRPCError } from "@trpc/server";

import { creariaCiclo } from "@appweb/core";
import { esquemaCategoria, esquemaMarca } from "@appweb/core/tipos";
import { Prisma } from "@appweb/db";
import type { z } from "zod";

import { rechazar } from "../../stock";
import { exige, router } from "../../trpc";

const gestionar = exige("gestionar_productos");

/** Que regenerar en la tienda al cambiar una categoria o una marca. */
export interface RevalidarCatalogo {
  navegacion: boolean;
  catalogo: boolean;
  portada: boolean;
}

function traducirError(error: unknown, que: "categoría" | "marca"): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const campos = String((error.meta as { target?: unknown } | undefined)?.target ?? "");
    if (campos.includes("nombre")) rechazar(`Ya existe una ${que} con ese nombre.`, "CONFLICT");
    rechazar(`Ya hay una ${que} con esa dirección web. Cambia el slug.`, "CONFLICT");
  }
  throw error;
}

function datosDeCategoria(d: z.infer<typeof esquemaCategoria>) {
  return {
    nombre: d.nombre,
    slug: d.slug,
    padreId: d.padreId,
    descripcion: d.descripcion || null,
    imagenUrl: d.imagenUrl || null,
    tituloSeo: d.tituloSeo || null,
    descripcionSeo: d.descripcionSeo || null,
    orden: d.orden,
    destacado: d.destacado,
    activo: d.activo,
  };
}

function datosDeMarca(d: z.infer<typeof esquemaMarca>) {
  return {
    nombre: d.nombre,
    slug: d.slug,
    descripcion: d.descripcion || null,
    logoUrl: d.logoUrl || null,
    tituloSeo: d.tituloSeo || null,
    descripcionSeo: d.descripcionSeo || null,
    orden: d.orden,
    destacado: d.destacado,
    activo: d.activo,
  };
}

export const categorias = router({
  listar: gestionar.query(async ({ ctx }) => {
    const filas = await ctx.prisma.categoria.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      include: { _count: { select: { productos: true, hijas: true } } },
    });
    return filas.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      padreId: c.padreId,
      descripcion: c.descripcion ?? "",
      imagenUrl: c.imagenUrl ?? "",
      tituloSeo: c.tituloSeo ?? "",
      descripcionSeo: c.descripcionSeo ?? "",
      orden: c.orden,
      destacado: c.destacado,
      activo: c.activo,
      productos: c._count.productos,
      hijas: c._count.hijas,
    }));
  }),

  guardar: gestionar.input(esquemaCategoria).mutation(async ({ ctx, input }) => {
    if (input.padreId !== null) {
      const todas = await ctx.prisma.categoria.findMany({ select: { id: true, padreId: true } });
      const padres = new Map(todas.map((c) => [c.id, c.padreId]));
      if (!padres.has(input.padreId)) rechazar("La categoría padre ya no existe.", "NOT_FOUND");
      if (input.categoriaId && creariaCiclo(input.categoriaId, input.padreId, padres)) {
        rechazar("Una categoría no puede ir dentro de sí misma ni de una de sus subcategorías.");
      }
    }

    try {
      const datos = datosDeCategoria(input);
      const fila = input.categoriaId
        ? await ctx.prisma.categoria.update({ where: { id: input.categoriaId }, data: datos })
        : await ctx.prisma.categoria.create({ data: datos });
      const revalidar: RevalidarCatalogo = { navegacion: true, catalogo: true, portada: true };
      return { id: fila.id, revalidar };
    } catch (error) {
      traducirError(error, "categoría");
    }
  }),
});

export const marcas = router({
  listar: gestionar.query(async ({ ctx }) => {
    const filas = await ctx.prisma.marca.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      include: { _count: { select: { productos: true } } },
    });
    return filas.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      slug: m.slug,
      descripcion: m.descripcion ?? "",
      logoUrl: m.logoUrl ?? "",
      tituloSeo: m.tituloSeo ?? "",
      descripcionSeo: m.descripcionSeo ?? "",
      orden: m.orden,
      destacado: m.destacado,
      activo: m.activo,
      productos: m._count.productos,
    }));
  }),

  guardar: gestionar.input(esquemaMarca).mutation(async ({ ctx, input }) => {
    try {
      const datos = datosDeMarca(input);
      const fila = input.marcaId
        ? await ctx.prisma.marca.update({ where: { id: input.marcaId }, data: datos })
        : await ctx.prisma.marca.create({ data: datos });
      // La fila de marcas de la portada y las paginas de marca.
      const revalidar: RevalidarCatalogo = { navegacion: false, catalogo: true, portada: true };
      return { id: fila.id, revalidar };
    } catch (error) {
      traducirError(error, "marca");
    }
  }),
});
