/**
 * Nivel de recompensa de un cliente, leido de sus pedidos. Una sola consulta
 * que usan el checkout de la web, "Mi cuenta" y la ficha del panel: el nivel
 * que se ve es el mismo que descuenta.
 */

import { ESTADOS_VENTA, nivelPorCompras, type EstadoNivel } from "@appweb/core";
import type { PrismaClient } from "@appweb/db";

export async function nivelDeUsuario(
  prisma: PrismaClient,
  usuarioId: string,
): Promise<EstadoNivel> {
  const comprado = await prisma.pedido.aggregate({
    where: { usuarioId, estado: { in: [...ESTADOS_VENTA] } },
    _sum: { total: true },
  });
  return nivelPorCompras(Number(comprado._sum.total ?? 0));
}
