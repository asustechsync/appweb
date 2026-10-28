/**
 * Nivel de recompensa de un cliente, leido de sus pedidos (monto y cantidad)
 * contra los niveles vigentes de la tabla `niveles`. Una sola consulta que usan el checkout de la
 * web, "Mi cuenta" y la ficha del panel: el nivel que se ve es el mismo que
 * descuenta.
 */

import {
  armarRanking,
  ESTADOS_VENTA,
  IDS_NIVEL,
  nivelPorCompras,
  type CompraDeCliente,
  type EstadoNivel,
  type Nivel,
  type PuestoRanking,
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

/**
 * Los clientes que mas compraron, por gasto y por cantidad de pedidos, cada uno
 * con su nivel. Cuenta todo lo comprado (pedidos pagados en adelante): son dos
 * agrupaciones con tope en la base, no se leen todos los clientes.
 */
export async function rankingDeClientes(
  prisma: PrismaClient,
  limite: number,
): Promise<{ porGasto: PuestoRanking[]; porPedidos: PuestoRanking[] }> {
  const where = { estado: { in: [...ESTADOS_VENTA] } };
  const [porGasto, porPedidos, niveles] = await Promise.all([
    prisma.pedido.groupBy({
      by: ["usuarioId"],
      where,
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: "desc" } },
      take: limite,
    }),
    prisma.pedido.groupBy({
      by: ["usuarioId"],
      where,
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _count: { usuarioId: "desc" } },
      take: limite,
    }),
    nivelesVigentes(prisma),
  ]);

  const ids = [...new Set([...porGasto, ...porPedidos].map((fila) => fila.usuarioId))];
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true },
  });
  const nombres = new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre]));

  const aCompras = (filas: typeof porGasto): CompraDeCliente[] =>
    filas.map((fila) => ({
      usuarioId: fila.usuarioId,
      nombre: nombres.get(fila.usuarioId) ?? "Cliente",
      total: Number(fila._sum.total ?? 0),
      pedidos: fila._count._all,
    }));

  return {
    porGasto: armarRanking(aCompras(porGasto), niveles, "gasto", limite),
    porPedidos: armarRanking(aCompras(porPedidos), niveles, "pedidos", limite),
  };
}
