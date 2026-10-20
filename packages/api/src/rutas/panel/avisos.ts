/**
 * Avisos del panel: cuantos pedidos y reclamos esperan a alguien. El panel la
 * consulta cada minuto, asi que son unos `count` y nada mas.
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
    const atender = puede(rol, "atender_reclamos");
    const moderar = puede(rol, "moderar_resenas");

    const [porConfirmar, ultimo, porDespachar, reclamosPendientes, resenasPendientes] =
      await Promise.all([
        verVentas ? ctx.prisma.pedido.count({ where: { estado: "PENDIENTE_PAGO" } }) : 0,
        verVentas
          ? ctx.prisma.pedido.findFirst({
              where: { estado: "PENDIENTE_PAGO" },
              orderBy: { creadoEn: "desc" },
              select: { codigo: true, creadoEn: true },
            })
          : null,
        despachar ? ctx.prisma.pedido.count({ where: { estado: "PAGADO" } }) : 0,
        atender ? ctx.prisma.reclamo.count({ where: { estado: "PENDIENTE" } }) : 0,
        moderar ? ctx.prisma.resena.count({ where: { estado: "PENDIENTE" } }) : 0,
      ]);

    return {
      porConfirmar,
      porDespachar,
      reclamosPendientes,
      resenasPendientes,
      /** El pedido pendiente mas reciente: el panel lo compara para avisar "llego uno". */
      ultimoPendiente: ultimo
        ? { codigo: ultimo.codigo, creadoEn: ultimo.creadoEn.toISOString() }
        : null,
    };
  }),
});
