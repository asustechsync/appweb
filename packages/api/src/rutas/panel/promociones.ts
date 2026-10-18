/**
 * Promociones del panel: los banners del carrusel de la portada y los cupones
 * de descuento. Todo de `gestionar_ajustes`.
 *
 * Nada se borra: un banner o un cupon se apagan con `activo`. Un cupon usado
 * queda en los pedidos por su codigo, y borrarlo dejaria esa venta sin saber
 * de donde salio su descuento.
 */

import { TRPCError } from "@trpc/server";

import { IMAGEN_DEMO } from "@appweb/core";
import { esquemaBanner, esquemaCupon } from "@appweb/core/tipos";
import { Prisma } from "@appweb/db";

import { rechazar } from "../../stock";
import { exige, router } from "../../trpc";

const ajustar = exige("gestionar_ajustes");

/** "2026-12-31" -> inicio o fin de ese dia en Lima (UTC-5, sin horario de verano). */
function fechaLima(fecha: string | null, fin: boolean): Date | null {
  if (fecha === null) return null;
  return new Date(`${fecha}T${fin ? "23:59:59.999" : "00:00:00.000"}-05:00`);
}

/** Date -> "2026-12-31" en Lima, para el formulario. */
function diaLima(fecha: Date | null): string | null {
  if (fecha === null) return null;
  return new Date(fecha.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const promociones = router({
  banners: ajustar.query(async ({ ctx }) => {
    const banners = await ctx.prisma.banner.findMany({
      orderBy: [{ activo: "desc" }, { orden: "asc" }, { creadoEn: "asc" }],
      select: {
        id: true,
        etiqueta: true,
        titulo: true,
        texto: true,
        accion: true,
        href: true,
        orden: true,
        activo: true,
      },
    });
    return banners;
  }),

  guardarBanner: ajustar.input(esquemaBanner).mutation(async ({ ctx, input }) => {
    const datos = {
      etiqueta: input.etiqueta,
      titulo: input.titulo,
      texto: input.texto,
      accion: input.accion,
      href: input.href,
      orden: input.orden,
      activo: input.activo,
    };
    if (input.bannerId) {
      const existe = await ctx.prisma.banner.findUnique({ where: { id: input.bannerId } });
      if (existe === null) rechazar("Ese banner no existe.", "NOT_FOUND");
      await ctx.prisma.banner.update({ where: { id: input.bannerId }, data: datos });
    } else {
      // El carrusel no muestra imagen: queda la demo hasta que la use.
      await ctx.prisma.banner.create({ data: { ...datos, imagenUrl: IMAGEN_DEMO } });
    }
    return { ok: true };
  }),

  cupones: ajustar.query(async ({ ctx }) => {
    const cupones = await ctx.prisma.cupon.findMany({
      orderBy: [{ activo: "desc" }, { creadoEn: "desc" }],
    });
    return cupones.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      porcentaje: c.porcentaje,
      minimoCompra: c.minimoCompra === null ? null : Number(c.minimoCompra),
      usosMaximos: c.usosMaximos,
      usos: c.usos,
      desde: diaLima(c.desde),
      hasta: diaLima(c.hasta),
      activo: c.activo,
    }));
  }),

  guardarCupon: ajustar.input(esquemaCupon).mutation(async ({ ctx, input }) => {
    const datos = {
      codigo: input.codigo,
      porcentaje: input.porcentaje,
      minimoCompra: input.minimoCompra,
      usosMaximos: input.usosMaximos,
      desde: fechaLima(input.desde, false),
      hasta: fechaLima(input.hasta, true),
      activo: input.activo,
    };
    try {
      if (input.cuponId) {
        await ctx.prisma.cupon.update({ where: { id: input.cuponId }, data: datos });
      } else {
        await ctx.prisma.cupon.create({ data: datos });
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new TRPCError({ code: "CONFLICT", message: "Ya existe un cupón con ese código." });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ese cupón no existe." });
      }
      throw error;
    }
    return { ok: true };
  }),
});
