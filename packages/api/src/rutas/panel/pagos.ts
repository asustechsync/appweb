/**
 * Pagos del panel: la cola de cobros de todos los pedidos, en un solo sitio.
 *
 * Confirmar un pago no vive aqui: es `panel.pedidos.confirmarPago`, porque
 * mueve el pedido y descuenta el stock. Esta ruta lista y rechaza. Rechazar
 * deja el intento con su motivo y abre otro pendiente por el mismo monto: el
 * pedido sigue esperando que el cliente pague (`revisarRechazoPago`).
 */

import { TRPCError } from "@trpc/server";

import {
  ESTADOS_PAGO,
  mensajeDeRechazoPago,
  notaDeRechazoPago,
  revisarRechazoPago,
  type EstadoPago,
} from "@appweb/core";
import { esquemaFiltroPagos, esquemaRechazarPago } from "@appweb/core/tipos";

import { rechazar } from "../../stock";
import { exige, router } from "../../trpc";

const ver = exige("ver_ventas");
const gestionar = exige("cambiar_estado_pedido");

/** Cuantos pagos trae la lista. La busqueda por texto filtra en el cliente. */
const TOPE_LISTA = 100;

export const pagos = router({
  /** Lista por estado, con conteo y monto de cada estado para las pestañas. */
  listar: ver.input(esquemaFiltroPagos).query(async ({ ctx, input }) => {
    const [filas, totales] = await Promise.all([
      ctx.prisma.pago.findMany({
        where: input.estado ? { estado: input.estado } : {},
        // Los pendientes, del mas viejo al mas nuevo: el que mas espera, arriba.
        orderBy: { creadoEn: input.estado === "PENDIENTE" ? "asc" : "desc" },
        take: TOPE_LISTA,
        include: {
          confirmadoPor: { select: { nombre: true } },
          pedido: {
            select: {
              id: true,
              codigo: true,
              estado: true,
              usuario: { select: { nombre: true, email: true } },
            },
          },
        },
      }),
      ctx.prisma.pago.groupBy({ by: ["estado"], _count: { _all: true }, _sum: { monto: true } }),
    ]);

    const porEstado = Object.fromEntries(
      ESTADOS_PAGO.map((e) => [e, { cantidad: 0, monto: 0 }]),
    ) as Record<EstadoPago, { cantidad: number; monto: number }>;
    for (const fila of totales) {
      porEstado[fila.estado] = {
        cantidad: fila._count._all,
        monto: Number(fila._sum.monto ?? 0),
      };
    }

    return {
      porEstado,
      pagos: filas.map((p) => ({
        id: p.id,
        medio: p.medio,
        monto: Number(p.monto),
        estado: p.estado,
        referencia: p.referencia,
        comprobanteUrl: p.comprobanteUrl,
        creadoEn: p.creadoEn.toISOString(),
        confirmadoPor: p.confirmadoPor?.nombre ?? null,
        confirmadoEn: p.confirmadoEn?.toISOString() ?? null,
        pedidoId: p.pedido.id,
        codigo: p.pedido.codigo,
        estadoPedido: p.pedido.estado,
        cliente: p.pedido.usuario.nombre,
        email: p.pedido.usuario.email,
      })),
    };
  }),

  /** PENDIENTE -> RECHAZADO, y un pago pendiente nuevo para el reintento. */
  rechazar: gestionar.input(esquemaRechazarPago).mutation(({ ctx, input }) =>
    ctx.prisma.$transaction(async (tx) => {
      const pago = await tx.pago.findFirst({
        where: { id: input.pagoId, pedidoId: input.pedidoId },
        include: { pedido: { select: { codigo: true, estado: true } } },
      });
      if (pago === null) throw new TRPCError({ code: "NOT_FOUND", message: "Ese pago no existe." });

      const rechazo = revisarRechazoPago({
        estadoPedido: pago.pedido.estado,
        estadoPago: pago.estado,
        medio: pago.medio,
        motivo: input.motivo,
      });
      if (rechazo !== null) rechazar(mensajeDeRechazoPago(rechazo));

      // Solo si sigue pendiente: si otro lo confirmo entre la lectura y aqui,
      // no se rechaza un pago que ya cobro.
      const { count } = await tx.pago.updateMany({
        where: { id: pago.id, estado: "PENDIENTE" },
        data: {
          estado: "RECHAZADO",
          confirmadoPorId: ctx.sesion.usuarioId,
          confirmadoEn: new Date(),
        },
      });
      if (count === 0) {
        rechazar("Otra persona resolvió este pago mientras lo revisabas.", "CONFLICT");
      }

      await tx.pago.create({
        data: { pedidoId: input.pedidoId, medio: pago.medio, monto: pago.monto },
      });

      await tx.historialPedido.create({
        data: {
          pedidoId: input.pedidoId,
          estadoAnterior: pago.pedido.estado,
          estadoNuevo: pago.pedido.estado,
          usuarioId: ctx.sesion.usuarioId,
          nota: notaDeRechazoPago(pago.medio, input.motivo),
        },
      });

      return { codigo: pago.pedido.codigo };
    }),
  ),
});
