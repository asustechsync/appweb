/**
 * Escritura de stock compartida por las rutas del panel (pedidos, productos,
 * stock). Un solo sitio que cumple la regla 5: ningun cambio de stock sin su
 * MovimientoStock, y el saldo cacheado de `Variante.stock` siempre al dia.
 */

import { TRPCError } from "@trpc/server";

import type { MovimientoNuevo } from "@appweb/core";
import type { Prisma } from "@appweb/db";

export type Transaccion = Prisma.TransactionClient;

/** Producto cuyas paginas la tienda tiene que regenerar. */
export interface ProductoTocado {
  slug: string;
  slugCategoria: string;
}

export function rechazar(
  mensaje: string,
  code: "BAD_REQUEST" | "CONFLICT" | "NOT_FOUND" = "BAD_REQUEST",
): never {
  throw new TRPCError({ code, message: mensaje });
}

/** La restriccion `stock >= 0` de la base: alguien se llevo la ultima unidad. */
export function esStockNegativo(error: unknown): boolean {
  return error instanceof Error && error.message.includes("variantes_stock_no_negativo");
}

/**
 * Escribe los movimientos y ajusta `Variante.stock`, que es el saldo cacheado
 * de esos movimientos. Siempre los dos juntos, dentro de la transaccion de
 * quien llama: nunca uno sin el otro.
 *
 * `usuarioId` es quien lo registro a mano (ingreso, ajuste, merma). Las
 * ventas y devoluciones las hace el sistema: `null`.
 */
export async function aplicarMovimientos(
  tx: Transaccion,
  movimientos: MovimientoNuevo[],
  usuarioId: string | null = null,
): Promise<ProductoTocado[]> {
  if (movimientos.length === 0) return [];

  await tx.movimientoStock.createMany({
    data: movimientos.map((m) => ({
      varianteId: m.varianteId,
      delta: m.delta,
      motivo: m.motivo,
      pedidoId: m.pedidoId ?? null,
      usuarioId,
      nota: m.nota ?? null,
    })),
  });

  const tocados = new Map<string, ProductoTocado>();
  for (const m of movimientos) {
    const variante = await tx.variante.update({
      where: { id: m.varianteId },
      data: { stock: { increment: m.delta } },
      select: { producto: { select: { slug: true, categoria: { select: { slug: true } } } } },
    });
    tocados.set(variante.producto.slug, {
      slug: variante.producto.slug,
      slugCategoria: variante.producto.categoria.slug,
    });
  }
  return [...tocados.values()];
}
