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
  igvIncluido,
  marcaDeTarjeta,
  mensajeDeRechazoPago,
  notaDeRechazoPago,
  revisarRechazoPago,
  serieAcumulada,
  variacion,
  ventanaDe,
  ventanaDeFecha,
  type EstadoPago,
} from "@appweb/core";
import {
  esquemaDetallePago,
  esquemaFiltroPagos,
  esquemaMetricasPagos,
  esquemaRechazarPago,
} from "@appweb/core/tipos";

import { nivelDeUsuario } from "../../clientes";
import { rechazar } from "../../stock";
import { exige, router, type Contexto } from "../../trpc";

const ver = exige("ver_ventas");
const gestionar = exige("cambiar_estado_pedido");

const INCLUDE_LISTA = {
  confirmadoPor: { select: { nombre: true } },
  pedido: {
    select: {
      id: true,
      codigo: true,
      estado: true,
      bancoTransferencia: true,
      usuario: { select: { nombre: true, email: true } },
    },
  },
} as const;

/**
 * Los pagos de la lista. Con un estado, ese estado. Sin estado, todos con los
 * pendientes arriba (del mas viejo al mas nuevo) y luego el resto del mas
 * nuevo al mas viejo: asi el tope nunca deja fuera lo que hay que atender.
 */
async function listarPagos(
  prisma: Contexto["prisma"],
  estado: EstadoPago | undefined,
  busqueda: string | undefined,
  limite: number,
) {
  // Trae uno de mas: si llega, hay pagos que "Ver mas" todavia no muestra.
  const tope = limite + 1;
  const coincide = busqueda
    ? {
        OR: [
          { referencia: { contains: busqueda, mode: "insensitive" as const } },
          {
            pedido: {
              codigo: { contains: busqueda, mode: "insensitive" as const },
            },
          },
          {
            pedido: {
              usuario: {
                nombre: { contains: busqueda, mode: "insensitive" as const },
              },
            },
          },
        ],
      }
    : {};

  if (estado) {
    return prisma.pago.findMany({
      where: { estado, ...coincide },
      orderBy: { creadoEn: estado === "PENDIENTE" ? "asc" : "desc" },
      take: tope,
      include: INCLUDE_LISTA,
    });
  }
  const pendientes = await prisma.pago.findMany({
    where: { estado: "PENDIENTE", ...coincide },
    orderBy: { creadoEn: "asc" },
    take: tope,
    include: INCLUDE_LISTA,
  });
  const resto = await prisma.pago.findMany({
    where: { estado: { not: "PENDIENTE" }, ...coincide },
    orderBy: { creadoEn: "desc" },
    take: Math.max(tope - pendientes.length, 0),
    include: INCLUDE_LISTA,
  });
  return [...pendientes, ...resto];
}

export const pagos = router({
  /** Lista por estado, con conteo y monto de cada estado para las pestañas. */
  listar: ver.input(esquemaFiltroPagos).query(async ({ ctx, input }) => {
    const [encontrados, totales] = await Promise.all([
      listarPagos(ctx.prisma, input.estado, input.busqueda || undefined, input.limite),
      ctx.prisma.pago.groupBy({
        by: ["estado"],
        _count: { _all: true },
        _sum: { monto: true },
      }),
    ]);

    // Sin filtro, un pedido sale una sola vez: sus intentos rechazados y el
    // pendiente que se anula al cancelar eran filas repetidas. Entra la
    // primera de cada pedido (el pendiente, o si no el pago mas nuevo) y se
    // cuenta cuantos rechazos llevo. Con un estado elegido la lista es de
    // pagos, no de pedidos, y se deja tal cual.
    const unicos = input.estado
      ? encontrados
      : encontrados.filter((p, i) => encontrados.findIndex((o) => o.pedidoId === p.pedidoId) === i);
    const filas = unicos.slice(0, input.limite);

    const rechazosPorPedido = new Map(
      (
        await ctx.prisma.pago.groupBy({
          by: ["pedidoId"],
          where: {
            estado: "RECHAZADO",
            pedidoId: { in: filas.map((p) => p.pedidoId) },
          },
          _count: { _all: true },
        })
      ).map((r) => [r.pedidoId, r._count._all]),
    );

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
      hayMas: unicos.length > input.limite,
      pagos: filas.map((p) => ({
        id: p.id,
        medio: p.medio,
        monto: Number(p.monto),
        estado: p.estado,
        referencia: p.referencia,
        comprobanteUrl: p.comprobanteUrl,
        // Solo con tarjeta: la marca reconocida, para su logo.
        tarjeta: p.medio === "TARJETA" ? marcaDeTarjeta(p.tarjetaMarca) : null,
        creadoEn: p.creadoEn.toISOString(),
        confirmadoPor: p.confirmadoPor?.nombre ?? null,
        confirmadoEn: p.confirmadoEn?.toISOString() ?? null,
        pedidoId: p.pedido.id,
        codigo: p.pedido.codigo,
        bancoTransferencia: p.pedido.bancoTransferencia,
        estadoPedido: p.pedido.estado,
        cliente: p.pedido.usuario.nombre,
        email: p.pedido.usuario.email,
        // Rechazos del pedido, sin contar este pago si es el rechazado de la fila.
        rechazosPrevios:
          (rechazosPorPedido.get(p.pedidoId) ?? 0) - (p.estado === "RECHAZADO" ? 1 : 0),
      })),
    };
  }),

  /**
   * Las tarjetas de arriba: cada estado en el periodo (o dia) elegido contra
   * el anterior entero, con el mismo eje que el resumen de Inicio.
   */
  /**
   * Un pago con todo lo que hace falta para decidir sobre el: el comprobante,
   * los demas intentos de cobro del mismo pedido y los motivos de rechazo.
   * Del pedido solo lo justo para ubicarlo; el resto vive en Pedidos.
   */
  detalle: ver.input(esquemaDetallePago).query(async ({ ctx, input }) => {
    const pago = await ctx.prisma.pago.findUnique({
      where: { id: input.pagoId },
      include: {
        confirmadoPor: { select: { nombre: true } },
        pedido: {
          select: {
            id: true,
            codigo: true,
            estado: true,
            bancoTransferencia: true,
            subtotal: true,
            descuento: true,
            costoEnvio: true,
            cuponCodigo: true,
            envioTelefono: true,
            total: true,
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                creadoEn: true,
              },
            },
            items: { select: { cantidad: true } },
            pagos: {
              orderBy: { creadoEn: "asc" },
              include: { confirmadoPor: { select: { nombre: true } } },
            },
            // Solo las notas que deja `notaDeRechazoPago`: el porque de cada rechazo.
            historial: {
              where: { nota: { startsWith: "Pago por" } },
              orderBy: { creadoEn: "asc" },
              select: { nota: true, creadoEn: true },
            },
          },
        },
      },
    });
    if (pago === null)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ese pago no existe.",
      });

    // Quien es el cliente para la tienda: su nivel sale de lo que ya compro.
    const nivel = await nivelDeUsuario(ctx.prisma, pago.pedido.usuario.id);

    return {
      id: pago.id,
      medio: pago.medio,
      monto: Number(pago.monto),
      estado: pago.estado,
      referencia: pago.referencia,
      comprobanteUrl: pago.comprobanteUrl,
      tarjeta:
        pago.medio === "TARJETA"
          ? {
              marca: marcaDeTarjeta(pago.tarjetaMarca),
              ultimos: pago.tarjetaUltimos,
            }
          : null,
      creadoEn: pago.creadoEn.toISOString(),
      confirmadoPor: pago.confirmadoPor?.nombre ?? null,
      confirmadoEn: pago.confirmadoEn?.toISOString() ?? null,
      pedido: {
        id: pago.pedido.id,
        codigo: pago.pedido.codigo,
        estado: pago.pedido.estado,
        bancoTransferencia: pago.pedido.bancoTransferencia,
        total: Number(pago.pedido.total),
        // Desglose congelado en el pedido. El descuento es el del cupon o el
        // del nivel, el que fuera mayor al comprar: no se suman.
        subtotal: Number(pago.pedido.subtotal),
        descuento: Number(pago.pedido.descuento),
        costoEnvio: Number(pago.pedido.costoEnvio),
        cuponCodigo: pago.pedido.cuponCodigo,
        igv: igvIncluido(Number(pago.pedido.total)),
        cliente: pago.pedido.usuario.nombre,
        email: pago.pedido.usuario.email,
        // El de envio es el que el cliente dio para este pedido; si no, el de su cuenta.
        telefono: pago.pedido.envioTelefono ?? pago.pedido.usuario.telefono,
        articulos: pago.pedido.items.reduce((total, item) => total + item.cantidad, 0),
      },
      clienteResumen: {
        nivel: nivel.nivel.nombre,
        nivelId: nivel.nivel.id,
        pedidos: nivel.pedidos,
        totalComprado: nivel.totalComprado,
        desde: pago.pedido.usuario.creadoEn.toISOString(),
      },
      intentos: pago.pedido.pagos.map((p) => ({
        id: p.id,
        medio: p.medio,
        monto: Number(p.monto),
        estado: p.estado,
        referencia: p.referencia,
        creadoEn: p.creadoEn.toISOString(),
        confirmadoPor: p.confirmadoPor?.nombre ?? null,
      })),
      rechazos: pago.pedido.historial.map((h) => ({
        nota: h.nota ?? "",
        creadoEn: h.creadoEn.toISOString(),
      })),
    };
  }),

  metricas: ver.input(esquemaMetricasPagos).query(async ({ ctx, input }) => {
    const ahora = new Date();
    const periodo = input.fecha
      ? ventanaDeFecha(input.fecha, ahora)
      : ventanaDe(input.periodo, ahora);
    const registros = await ctx.prisma.pago.findMany({
      where: {
        creadoEn: {
          gte: periodo.previoDesde,
          lt: periodo.hasta ?? periodo.fin,
        },
      },
      select: { estado: true, monto: true, creadoEn: true },
    });

    // Cada estado contra el periodo anterior, por fecha de creacion del pago.
    const enVentana = (estado: EstadoPago, desde: Date, hasta: Date) =>
      registros
        .filter((p) => p.estado === estado && p.creadoEn >= desde && p.creadoEn < hasta)
        .map((p) => ({ en: p.creadoEn, valor: Number(p.monto) }));
    const suma = (lista: { valor: number }[]) => lista.reduce((total, r) => total + r.valor, 0);
    const porEstado = Object.fromEntries(
      ESTADOS_PAGO.map((estado) => {
        const actual = enVentana(estado, periodo.desde, periodo.hasta ?? periodo.fin);
        const previo = enVentana(estado, periodo.previoDesde, periodo.previoHasta);
        const monto = suma(actual);
        const montoPrevio = suma(previo);
        return [
          estado,
          {
            monto,
            montoPrevio,
            cantidad: actual.length,
            cambio: variacion(monto, montoPrevio),
            serie: serieAcumulada(actual, periodo.desde, periodo.fin, ahora),
            seriePrevia: serieAcumulada(previo, periodo.previoDesde, periodo.previoHasta),
          },
        ];
      }),
    ) as Record<
      EstadoPago,
      {
        monto: number;
        montoPrevio: number;
        cantidad: number;
        cambio: number;
        serie: number[];
        seriePrevia: number[];
      }
    >;

    return {
      titulo: periodo.titulo,
      etiquetaAnterior: periodo.etiquetaPrevio,
      porEstado,
    };
  }),

  /** PENDIENTE -> RECHAZADO, y un pago pendiente nuevo para el reintento. */
  rechazar: gestionar.input(esquemaRechazarPago).mutation(({ ctx, input }) =>
    ctx.prisma.$transaction(async (tx) => {
      const pago = await tx.pago.findFirst({
        where: { id: input.pagoId, pedidoId: input.pedidoId },
        include: { pedido: { select: { codigo: true, estado: true } } },
      });
      if (pago === null)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ese pago no existe.",
        });

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
        data: {
          pedidoId: input.pedidoId,
          medio: pago.medio,
          monto: pago.monto,
        },
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
