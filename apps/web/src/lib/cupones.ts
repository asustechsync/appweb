import { normalizarCodigo, type ReglaCupon } from "@appweb/core";
import { prisma } from "@appweb/db";

/**
 * El cupon tal como esta en la base, en la forma que entiende `revisarCupon`.
 * Solo servidor: la usan la accion del carrito y el cierre del checkout.
 */
export async function buscarReglaCupon(
  codigo: string | null | undefined,
): Promise<(ReglaCupon & { id: string }) | null> {
  const limpio = normalizarCodigo(codigo);
  if (limpio === "") return null;

  const fila = await prisma.cupon.findUnique({ where: { codigo: limpio } });
  if (fila === null) return null;

  return {
    id: fila.id,
    codigo: fila.codigo,
    porcentaje: fila.porcentaje,
    activo: fila.activo,
    minimoCompra: fila.minimoCompra === null ? null : Number(fila.minimoCompra),
    usosMaximos: fila.usosMaximos,
    usos: fila.usos,
    desde: fila.desde,
    hasta: fila.hasta,
  };
}
