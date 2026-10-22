/**
 * Proveedores y compras del panel.
 *
 * Registrar una compra escribe en UNA transaccion: la compra con sus lineas,
 * un INGRESO de stock por linea (regla 5, via `aplicarMovimientos`) y el costo
 * de la ultima compra en cada variante. Que se acepta lo decide `revisarCompra`
 * de @appweb/core.
 */

import { TRPCError } from "@trpc/server";

import {
  mensajeDeRechazoCompra,
  movimientosDeCompra,
  notaDeCompra,
  revisarCompra,
  totalDeCompra,
} from "@appweb/core";
import { esquemaCompra, esquemaIdProveedor, esquemaProveedor } from "@appweb/core/tipos";
import { Prisma } from "@appweb/db";

import { aplicarMovimientos, rechazar } from "../../stock";
import { exige, router } from "../../trpc";

const gestionar = exige("gestionar_productos");

/** Cuantas compras trae el historial de un proveedor. */
const TOPE_COMPRAS = 50;

export const proveedores = router({
  listar: gestionar.query(async ({ ctx }) => {
    const [filas, totales] = await Promise.all([
      ctx.prisma.proveedor.findMany({
        orderBy: [{ activo: "desc" }, { nombre: "asc" }],
        include: { _count: { select: { compras: true } } },
      }),
      ctx.prisma.compra.groupBy({
        by: ["proveedorId"],
        _sum: { total: true },
        _max: { creadoEn: true },
      }),
    ]);
    const porProveedor = new Map(totales.map((t) => [t.proveedorId, t]));
    return filas.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      ruc: p.ruc ?? "",
      contacto: p.contacto ?? "",
      telefono: p.telefono ?? "",
      email: p.email ?? "",
      nota: p.nota ?? "",
      activo: p.activo,
      compras: p._count.compras,
      comprado: Number(porProveedor.get(p.id)?._sum.total ?? 0),
      ultimaCompra: porProveedor.get(p.id)?._max.creadoEn?.toISOString() ?? null,
    }));
  }),

  guardar: gestionar.input(esquemaProveedor).mutation(async ({ ctx, input }) => {
    const datos = {
      nombre: input.nombre,
      ruc: input.ruc || null,
      contacto: input.contacto || null,
      telefono: input.telefono || null,
      email: input.email || null,
      nota: input.nota || null,
      activo: input.activo,
    };
    try {
      const fila = input.proveedorId
        ? await ctx.prisma.proveedor.update({ where: { id: input.proveedorId }, data: datos })
        : await ctx.prisma.proveedor.create({ data: datos });
      return { id: fila.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        rechazar("Ya existe un proveedor con ese nombre.", "CONFLICT");
      }
      throw error;
    }
  }),

  /** Compras de un proveedor, de la mas nueva a la mas vieja, con sus lineas. */
  compras: gestionar.input(esquemaIdProveedor).query(async ({ ctx, input }) => {
    const filas = await ctx.prisma.compra.findMany({
      where: { proveedorId: input.proveedorId },
      orderBy: { creadoEn: "desc" },
      take: TOPE_COMPRAS,
      include: {
        usuario: { select: { nombre: true } },
        items: {
          include: {
            variante: {
              select: {
                talla: true,
                color: true,
                sku: true,
                producto: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });
    return filas.map((c) => ({
      id: c.id,
      documento: c.documento,
      total: Number(c.total),
      nota: c.nota,
      usuario: c.usuario.nombre,
      creadoEn: c.creadoEn.toISOString(),
      items: c.items.map((i) => ({
        id: i.id,
        producto: i.variante.producto.nombre,
        talla: i.variante.talla,
        color: i.variante.color,
        sku: i.variante.sku,
        cantidad: i.cantidad,
        costoUnitario: Number(i.costoUnitario),
      })),
    }));
  }),

  /** Variantes para armar una compra o un pack: con precio, costo y stock. */
  variantes: gestionar.query(async ({ ctx }) => {
    const filas = await ctx.prisma.variante.findMany({
      orderBy: [{ producto: { nombre: "asc" } }, { color: "asc" }, { talla: "asc" }],
      select: {
        id: true,
        talla: true,
        color: true,
        sku: true,
        stock: true,
        costo: true,
        activo: true,
        producto: { select: { nombre: true, precio: true, activo: true } },
      },
    });
    return filas.map((v) => ({
      id: v.id,
      etiqueta: `${v.producto.nombre} · ${v.color} · ${v.talla}`,
      sku: v.sku,
      stock: v.stock,
      precio: Number(v.producto.precio),
      costo: v.costo === null ? null : Number(v.costo),
      activa: v.activo && v.producto.activo,
    }));
  }),

  registrarCompra: gestionar.input(esquemaCompra).mutation(({ ctx, input }) =>
    ctx.prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.findUnique({
        where: { id: input.proveedorId },
        select: { nombre: true, activo: true },
      });
      if (proveedor === null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ese proveedor no existe." });
      }

      const rechazo = revisarCompra({ proveedorActivo: proveedor.activo, lineas: input.lineas });
      if (rechazo !== null) rechazar(mensajeDeRechazoCompra(rechazo));

      const existen = await tx.variante.count({
        where: { id: { in: input.lineas.map((l) => l.varianteId) } },
      });
      if (existen !== input.lineas.length) rechazar("Alguna prenda de la compra ya no existe.");

      const documento = input.documento?.trim() || null;
      const compra = await tx.compra.create({
        data: {
          proveedorId: input.proveedorId,
          documento,
          nota: input.nota?.trim() || null,
          total: totalDeCompra(input.lineas),
          usuarioId: ctx.sesion.usuarioId,
          items: {
            create: input.lineas.map((l) => ({
              varianteId: l.varianteId,
              cantidad: l.cantidad,
              costoUnitario: l.costoUnitario,
            })),
          },
        },
        select: { id: true },
      });

      const tocados = await aplicarMovimientos(
        tx,
        movimientosDeCompra(input.lineas, compra.id, notaDeCompra(proveedor.nombre, documento)),
        ctx.sesion.usuarioId,
      );

      // Cache del costo: el de esta compra pasa a ser el de la variante.
      for (const linea of input.lineas) {
        await tx.variante.update({
          where: { id: linea.varianteId },
          data: { costo: linea.costoUnitario },
        });
      }

      return { compraId: compra.id, productosTocados: tocados };
    }),
  ),
});
