/**
 * Stock del panel: ver cuanto hay, registrar ingresos, ajustes y mermas, y
 * ver el historial de una variante.
 *
 * Que movimiento corresponde y cuando se rechaza lo decide
 * `planMovimientoManual` de @appweb/core. Aqui se lee el saldo, se pregunta y
 * se escribe con `aplicarMovimientos`, que deja el movimiento y el saldo
 * juntos en la misma transaccion.
 */

import { mensajeDeRechazoStock, planMovimientoManual, UMBRAL_STOCK_BAJO } from "@appweb/core";
import { esquemaIdVariante, esquemaMovimientoStock } from "@appweb/core/tipos";

import { aplicarMovimientos, esStockNegativo, rechazar } from "../../stock";
import { exige, router } from "../../trpc";

const ajustar = exige("ajustar_stock");

/** Cuantos movimientos trae el historial de una variante. */
const TOPE_HISTORIAL = 30;

export const stock = router({
  /** Todas las variantes con su saldo, las de stock bajo primero. */
  listar: ajustar.query(async ({ ctx }) => {
    const filas = await ctx.prisma.variante.findMany({
      orderBy: [{ stock: "asc" }, { producto: { nombre: "asc" } }],
      select: {
        id: true,
        talla: true,
        color: true,
        sku: true,
        stock: true,
        activo: true,
        producto: { select: { nombre: true, activo: true } },
      },
    });
    return {
      umbralBajo: UMBRAL_STOCK_BAJO,
      variantes: filas.map((v) => ({
        id: v.id,
        producto: v.producto.nombre,
        talla: v.talla,
        color: v.color,
        sku: v.sku,
        stock: v.stock,
        // Se vende solo si la variante y su producto estan activos.
        activa: v.activo && v.producto.activo,
      })),
    };
  }),

  historial: ajustar.input(esquemaIdVariante).query(async ({ ctx, input }) => {
    const movimientos = await ctx.prisma.movimientoStock.findMany({
      where: { varianteId: input.varianteId },
      orderBy: { creadoEn: "desc" },
      take: TOPE_HISTORIAL,
      select: {
        id: true,
        delta: true,
        motivo: true,
        nota: true,
        creadoEn: true,
        usuario: { select: { nombre: true } },
        pedido: { select: { codigo: true } },
      },
    });
    return movimientos.map((m) => ({
      id: m.id,
      delta: m.delta,
      motivo: m.motivo,
      nota: m.nota,
      creadoEn: m.creadoEn.toISOString(),
      usuario: m.usuario?.nombre ?? null,
      pedido: m.pedido?.codigo ?? null,
    }));
  }),

  /** Ingreso, ajuste por conteo o merma. */
  registrar: ajustar.input(esquemaMovimientoStock).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.prisma.$transaction(async (tx) => {
        const variante = await tx.variante.findUnique({
          where: { id: input.varianteId },
          select: { stock: true },
        });
        if (variante === null) rechazar("Esa variante no existe.", "NOT_FOUND");

        const plan = planMovimientoManual({
          tipo: input.tipo,
          varianteId: input.varianteId,
          cantidad: input.cantidad,
          stockActual: variante.stock,
          nota: input.nota ?? null,
        });
        if ("rechazo" in plan) rechazar(mensajeDeRechazoStock(plan.rechazo));

        const productos = await aplicarMovimientos(tx, [plan.movimiento], ctx.sesion.usuarioId);
        return {
          stockNuevo: variante.stock + plan.movimiento.delta,
          revalidar: { productos, catalogo: false },
        };
      });
    } catch (error) {
      // Una venta se llevo unidades entre la lectura y la merma.
      if (esStockNegativo(error)) {
        rechazar("El stock cambió mientras registrabas. Vuelve a intentarlo.", "CONFLICT");
      }
      throw error;
    }
  }),
});
