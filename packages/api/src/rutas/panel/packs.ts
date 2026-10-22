/**
 * Packs y combos del panel: lista con stock calculado, alta y edicion.
 *
 * El pack no guarda stock: sale de sus componentes (`stockDePack`). Editar
 * los componentes reemplaza la receta completa en una transaccion. Que pack
 * es valido lo decide `revisarPack` de @appweb/core.
 */

import {
  ahorroDePack,
  costoDePack,
  margenDe,
  mensajeDeRechazoPack,
  precioSueltoDePack,
  revisarPack,
  stockDePack,
  type ComponentePack,
} from "@appweb/core";
import { esquemaPack } from "@appweb/core/tipos";
import { Prisma } from "@appweb/db";

import { rechazar } from "../../stock";
import { exige, router } from "../../trpc";

const gestionar = exige("gestionar_productos");

const SELECCION_VARIANTE = {
  id: true,
  talla: true,
  color: true,
  stock: true,
  costo: true,
  activo: true,
  producto: { select: { nombre: true, precio: true, activo: true } },
} as const;

type VarianteLeida = Prisma.VarianteGetPayload<{ select: typeof SELECCION_VARIANTE }>;

function aComponente(cantidad: number, v: VarianteLeida): ComponentePack {
  return {
    varianteId: v.id,
    cantidad,
    precioSuelto: Number(v.producto.precio),
    stock: v.stock,
    activa: v.activo && v.producto.activo,
    costo: v.costo === null ? null : Number(v.costo),
  };
}

export const packs = router({
  listar: gestionar.query(async ({ ctx }) => {
    const filas = await ctx.prisma.pack.findMany({
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
      include: { items: { include: { variante: { select: SELECCION_VARIANTE } } } },
    });
    return filas.map((p) => {
      const componentes = p.items.map((i) => aComponente(i.cantidad, i.variante));
      const precio = Number(p.precio);
      const suelto = precioSueltoDePack(componentes);
      return {
        id: p.id,
        nombre: p.nombre,
        slug: p.slug,
        descripcion: p.descripcion ?? "",
        precio,
        activo: p.activo,
        stock: stockDePack(componentes),
        precioSuelto: suelto,
        ahorro: ahorroDePack(precio, suelto),
        margen: margenDe(precio, costoDePack(componentes)),
        componentes: p.items.map((i) => ({
          varianteId: i.varianteId,
          cantidad: i.cantidad,
          etiqueta: `${i.variante.producto.nombre} · ${i.variante.color} · ${i.variante.talla}`,
          stock: i.variante.stock,
        })),
      };
    });
  }),

  guardar: gestionar.input(esquemaPack).mutation(async ({ ctx, input }) => {
    const variantes = await ctx.prisma.variante.findMany({
      where: { id: { in: input.componentes.map((c) => c.varianteId) } },
      select: SELECCION_VARIANTE,
    });
    const porId = new Map(variantes.map((v) => [v.id, v]));
    const componentes = input.componentes.map((c) => {
      const v = porId.get(c.varianteId);
      if (v === undefined) rechazar("Alguna prenda del pack ya no existe.");
      return aComponente(c.cantidad, v);
    });

    const rechazo = revisarPack({ precio: input.precio, componentes });
    if (rechazo !== null) rechazar(mensajeDeRechazoPack(rechazo));

    const datos = {
      nombre: input.nombre,
      slug: input.slug,
      descripcion: input.descripcion || null,
      precio: input.precio,
      activo: input.activo,
    };
    const receta = input.componentes.map((c) => ({
      varianteId: c.varianteId,
      cantidad: c.cantidad,
    }));

    try {
      const pack = await ctx.prisma.$transaction(async (tx) => {
        if (input.packId === undefined) {
          return tx.pack.create({ data: { ...datos, items: { create: receta } } });
        }
        await tx.itemPack.deleteMany({ where: { packId: input.packId } });
        return tx.pack.update({
          where: { id: input.packId },
          data: { ...datos, items: { create: receta } },
        });
      });
      return { id: pack.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        rechazar("Ya hay un pack con esa dirección web. Cambia el slug.", "CONFLICT");
      }
      throw error;
    }
  }),
});
