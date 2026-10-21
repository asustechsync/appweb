/**
 * Niveles de recompensa del panel: leer los cinco niveles y guardarlos. Todo
 * de `gestionar_ajustes`, porque un requisito o un descuento cambian lo que
 * cobra el checkout desde ese momento.
 *
 * Las reglas entre niveles (Básico en 0, requisitos crecientes) las decide
 * `revisarNiveles` de @appweb/core: el esquema la aplica antes de llegar aqui.
 */

import { ESTADOS_VENTA } from "@appweb/core";
import { esquemaNiveles } from "@appweb/core/tipos";

import { nivelesVigentes } from "../../clientes";
import { rechazar } from "../../stock";
import { exige, router } from "../../trpc";

const ajustar = exige("gestionar_ajustes");

export const niveles = router({
  /**
   * Los niveles y lo que compro cada cliente (monto y pedidos). Con eso el
   * panel cuenta cuantos hay en cada nivel y a cuantos movería un cambio,
   * mientras se edita y sin volver a preguntar. Solo cifras: ni nombres ni
   * correos.
   */
  listar: ajustar.query(async ({ ctx }) => {
    const [vigentes, compras, totalClientes] = await Promise.all([
      nivelesVigentes(ctx.prisma),
      ctx.prisma.pedido.groupBy({
        by: ["usuarioId"],
        where: { estado: { in: [...ESTADOS_VENTA] }, usuario: { rol: "CLIENTE" } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      ctx.prisma.usuario.count({ where: { rol: "CLIENTE" } }),
    ]);

    const conCompras = compras.map((fila) => ({
      total: Number(fila._sum.total ?? 0),
      pedidos: fila._count._all,
    }));
    // Quien no compro nada tambien es cliente: entra en Básico.
    const sinCompras = Array.from(
      { length: Math.max(0, totalClientes - conCompras.length) },
      () => ({ total: 0, pedidos: 0 }),
    );

    return { niveles: vigentes, compras: [...conCompras, ...sinCompras] };
  }),

  guardar: ajustar.input(esquemaNiveles).mutation(async ({ ctx, input }) => {
    const existentes = await ctx.prisma.nivel.count();
    if (existentes !== input.niveles.length) {
      rechazar("Faltan niveles en la base. Corre las migraciones.", "CONFLICT");
    }

    await ctx.prisma.$transaction(
      input.niveles.map((nivel, orden) =>
        ctx.prisma.nivel.update({
          where: { id: nivel.id },
          data: {
            nombre: nivel.nombre,
            desde: nivel.desde,
            pedidosMinimos: nivel.pedidosMinimos,
            descuentoPct: nivel.descuentoPct,
            beneficio: nivel.beneficio,
            orden,
          },
        }),
      ),
    );

    return { ok: true };
  }),
});
