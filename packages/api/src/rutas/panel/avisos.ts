/**
 * Avisos del panel: cuantos pedidos esperan a alguien. El panel la consulta
 * cada minuto, asi que son dos `count` y nada mas.
 *
 * Cada numero sale solo si el rol puede actuar sobre el: un ALMACEN no ve
 * cuantos pagos faltan confirmar, un VENDEDOR no ve la cola de despacho.
 */

import { puede } from "@appweb/core";

import { exige, router } from "../../trpc";

const entrar = exige("entrar_panel");

export const avisos = router({
  contadores: entrar.query(async ({ ctx }) => {
    const { rol } = ctx.sesion;
    const verVentas = puede(rol, "ver_ventas");
    const despachar = puede(rol, "despachar_envios");

    const [porConfirmar, ultimo, porDespachar] = await Promise.all([
      verVentas ? ctx.prisma.pedido.count({ where: { estado: "PENDIENTE_PAGO" } }) : 0,
      verVentas
        ? ctx.prisma.pedido.findFirst({
            where: { estado: "PENDIENTE_PAGO" },
            orderBy: { creadoEn: "desc" },
            select: { codigo: true, creadoEn: true },
          })
        : null,
      despachar ? ctx.prisma.pedido.count({ where: { estado: "PAGADO" } }) : 0,
    ]);

    return {
      porConfirmar,
      porDespachar,
      /** El pedido pendiente mas reciente: el panel lo compara para avisar "llego uno". */
      ultimoPendiente: ultimo
        ? { codigo: ultimo.codigo, creadoEn: ultimo.creadoEn.toISOString() }
        : null,
    };
  }),
});
