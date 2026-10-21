/**
 * Nivel de recompensa de un cliente, leido de sus pedidos (monto y cantidad)
 * contra los niveles vigentes de la tabla `niveles`. Una sola consulta que usan el checkout de la
 * web, "Mi cuenta" y la ficha del panel: el nivel que se ve es el mismo que
 * descuenta.
 */

import {
  ESTADOS_VENTA,
  IDS_NIVEL,
  nivelPorCompras,
  type EstadoNivel,
  type Nivel,
} from "@appweb/core";
import type { PrismaClient } from "@appweb/db";

/** Los cinco niveles, de Básico a Platino, tal como estan guardados hoy. */
export async function nivelesVigentes(prisma: PrismaClient): Promise<Nivel[]> {
  const filas = await prisma.nivel.findMany({ orderBy: { orden: "asc" } });
  return filas
    .filter((fila) => (IDS_NIVEL as readonly string[]).includes(fila.id))
    .map((fila) => ({
      id: fila.id as Nivel["id"],
      nombre: fila.nombre,
      desde: Number(fila.desde),
      pedidosMinimos: fila.pedidosMinimos,
      descuentoPct: fila.descuentoPct,
      beneficio: fila.beneficio,
    }));
}

export async function nivelDeUsuario(
  prisma: PrismaClient,
  usuarioId: string,
): Promise<EstadoNivel> {
  const [comprado, niveles] = await Promise.all([
    prisma.pedido.aggregate({
      where: { usuarioId, estado: { in: [...ESTADOS_VENTA] } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    nivelesVigentes(prisma),
  ]);
  return nivelPorCompras(
    { total: Number(comprado._sum.total ?? 0), pedidos: comprado._count._all },
    niveles,
  );
}
