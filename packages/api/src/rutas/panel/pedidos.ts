/**
 * Pedidos del panel: lista, detalle, confirmar pago y cambiar estado.
 *
 * Que esta permitido y que stock se mueve lo decide @appweb/core
 * (`revisarConfirmacionPago`, `revisarCambioEstado`, `movimientosDelCambio`).
 * Esta ruta lee, pregunta y escribe todo en UNA transaccion: el pedido, el
 * pago, los movimientos de stock y el historial quedan juntos o no quedan.
 *
 * Dos personas pueden abrir el mismo pedido a la vez. El cambio de estado se
 * escribe con `updateMany` filtrando por el estado que se leyo: si otro ya lo
 * movio, no actualiza nada y se responde CONFLICT en vez de descontar dos
 * veces.
 */

import { TRPCError } from "@trpc/server";

import {
  correoCalificaTuCompra,
  ESTADOS_PEDIDO,
  estaAnonimizada,
  mensajeDeRechazoPedido,
  movimientosDelCambio,
  notaDeCambio,
  revisarCambioEstado,
  revisarConfirmacionPago,
  serieAcumulada,
  variacion,
  variantesSinStock,
  ventanaDe,
  ventanaDeFecha,
  type EntradaCambioEstado,
  type EstadoPedido,
  type RechazoPedido,
} from "@appweb/core";
import {
  esquemaCambioEstadoPedido,
  esquemaConfirmarPago,
  esquemaFiltroPedidos,
  esquemaIdPedido,
  esquemaMetricasPedidos,
} from "@appweb/core/tipos";
import { Prisma, type PrismaClient } from "@appweb/db";
import type { z } from "zod";

import { enviarCorreo } from "../../correo";
import { aplicarMovimientos, esStockNegativo, rechazar, type Transaccion } from "../../stock";
import { exige, router } from "../../trpc";
import { URL_TIENDA } from "../../urls";

const ver = exige("ver_ventas");
const gestionar = exige("cambiar_estado_pedido");

/** Cuantos pedidos trae la lista. La busqueda por texto filtra en el cliente. */
const TOPE_LISTA = 100;

/** Mensajes claros para los errores que la base puede devolver aqui. */
function traducirError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    rechazar("Ese número de operación ya se usó en otro pago.", "CONFLICT");
  }
  // Otro pedido se llevo la ultima unidad entre la revision y la escritura.
  if (esStockNegativo(error)) {
    rechazar(mensajeDeRechazoPedido("sin_stock"), "CONFLICT");
  }
  throw error;
}

/** Antes de descontar: un mensaje que diga QUE falta, no solo que algo falta. */
async function comprobarStock(
  tx: Transaccion,
  lineas: {
    varianteId: string;
    cantidad: number;
    nombreProducto: string;
    talla: string;
    color: string;
  }[],
) {
  const variantes = await tx.variante.findMany({
    where: { id: { in: lineas.map((l) => l.varianteId) } },
    select: { id: true, stock: true },
  });
  const faltan = variantesSinStock(lineas, new Map(variantes.map((v) => [v.id, v.stock])));
  if (faltan.length === 0) return;

  const nombres = lineas
    .filter((l) => faltan.includes(l.varianteId))
    .map((l) => `${l.nombreProducto} (${l.talla}, ${l.color})`);
  rechazar(`Sin stock suficiente: ${[...new Set(nombres)].join(", ")}.`, "CONFLICT");
}

/** Mueve el estado solo si nadie lo movio antes. */
async function moverEstado(
  tx: Transaccion,
  pedidoId: string,
  desde: EstadoPedido,
  datos: Prisma.PedidoUpdateManyMutationInput,
) {
  const { count } = await tx.pedido.updateMany({
    where: { id: pedidoId, estado: desde },
    data: datos,
  });
  if (count === 0) {
    rechazar(
      "Otra persona cambió este pedido mientras lo revisabas. Vuelve a abrirlo.",
      "CONFLICT",
    );
  }
}

/**
 * Cambia el estado de un pedido en UNA transaccion: estado (solo si nadie lo
 * movio antes), pagos, stock e historial. La usan Pedidos (cualquier cambio
 * permitido) y Envios (solo los pasos del almacen): cada ruta pasa su propia
 * regla en `revisar`, el resto es identico.
 */
export async function ejecutarCambioEstado(
  prisma: PrismaClient,
  actorId: string,
  input: z.infer<typeof esquemaCambioEstadoPedido>,
  revisar: (entrada: EntradaCambioEstado) => RechazoPedido | null,
) {
  let resultado: Awaited<ReturnType<typeof cambiarEnTransaccion>>;
  try {
    resultado = await cambiarEnTransaccion(prisma, actorId, input, revisar);
  } catch (error) {
    traducirError(error);
  }

  // Fuera de la transaccion: un correo que falla no deshace la entrega.
  const { entregado, ...respuesta } = resultado;
  if (entregado && !estaAnonimizada(entregado.email)) {
    const { asunto, cuerpo } = correoCalificaTuCompra({
      nombre: entregado.nombre,
      codigo: respuesta.codigo,
      productos: entregado.productos,
      enlace: `${URL_TIENDA}/mi-cuenta/resenas`,
    });
    await enviarCorreo(entregado.email, asunto, cuerpo);
  }
  return respuesta;
}

async function cambiarEnTransaccion(
  prisma: PrismaClient,
  actorId: string,
  input: z.infer<typeof esquemaCambioEstadoPedido>,
  revisar: (entrada: EntradaCambioEstado) => RechazoPedido | null,
) {
  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id: input.pedidoId },
      include: { items: true, usuario: { select: { nombre: true, email: true } } },
    });
    if (!pedido) throw new TRPCError({ code: "NOT_FOUND", message: "Ese pedido no existe." });

    const hacia = input.estado;
    const rechazo = revisar({ desde: pedido.estado, hacia, medio: pedido.medioPago });
    if (rechazo !== null) rechazar(mensajeDeRechazoPedido(rechazo));

    const movimientos = movimientosDelCambio(pedido.estado, hacia, pedido.items, pedido.id);
    if (movimientos.some((m) => m.delta < 0)) await comprobarStock(tx, pedido.items);

    const ahora = new Date();
    await moverEstado(tx, pedido.id, pedido.estado, {
      estado: hacia,
      ...(hacia === "ENVIADO"
        ? {
            enviadoEn: ahora,
            transportista: input.transportista || null,
            codigoSeguimiento: input.codigoSeguimiento || null,
          }
        : {}),
      ...(hacia === "ENTREGADO" ? { entregadoEn: ahora } : {}),
    });

    if (hacia === "CANCELADO") {
      // El pago que se esperaba ya no se acepta: queda ANULADO, no RECHAZADO,
      // porque nadie intento cobrar. Uno confirmado se deja como esta:
      // devolver la plata es un paso aparte y manual.
      await tx.pago.updateMany({
        where: { pedidoId: pedido.id, estado: "PENDIENTE" },
        data: { estado: "ANULADO" },
      });
    }

    if (hacia === "ENTREGADO" && pedido.medioPago === "CONTRA_ENTREGA") {
      // Contra entrega: el cobro llega con el paquete.
      await tx.pago.updateMany({
        where: { pedidoId: pedido.id, estado: "PENDIENTE" },
        data: {
          estado: "CONFIRMADO",
          confirmadoPorId: actorId,
          confirmadoEn: ahora,
        },
      });
    }

    const tocados = await aplicarMovimientos(tx, movimientos);

    await tx.historialPedido.create({
      data: {
        pedidoId: pedido.id,
        estadoAnterior: pedido.estado,
        estadoNuevo: hacia,
        usuarioId: actorId,
        nota: notaDeCambio(hacia, { nota: input.nota ?? null }),
      },
    });

    return {
      codigo: pedido.codigo,
      productosTocados: tocados,
      // Al entregar se le pide su opinion al cliente (ver `ejecutarCambioEstado`).
      entregado:
        hacia === "ENTREGADO"
          ? {
              nombre: pedido.usuario.nombre,
              email: pedido.usuario.email,
              productos: [...new Set(pedido.items.map((i) => i.nombreProducto))],
            }
          : null,
    };
  });
}

export const pedidos = router({
  /** Lista por estado, con el conteo de cada estado para las pestañas. */
  listar: ver.input(esquemaFiltroPedidos).query(async ({ ctx, input }) => {
    const [filas, conteo] = await Promise.all([
      ctx.prisma.pedido.findMany({
        where: input.estados?.length ? { estado: { in: input.estados } } : {},
        // Los pendientes, del mas viejo al mas nuevo: el que mas espera, arriba.
        orderBy: {
          creadoEn:
            input.estados?.length === 1 && input.estados[0] === "PENDIENTE_PAGO" ? "asc" : "desc",
        },
        take: TOPE_LISTA,
        select: {
          id: true,
          codigo: true,
          estado: true,
          total: true,
          medioPago: true,
          creadoEn: true,
          envioDepartamento: true,
          usuario: { select: { nombre: true, email: true } },
          _count: { select: { items: true } },
          // Pagos que esperan al equipo: si el cliente ya mando referencia o voucher, toca confirmarlos.
          pagos: {
            where: { estado: "PENDIENTE" },
            select: { referencia: true, comprobanteUrl: true },
          },
          // Solo la foto del primer producto: es la miniatura de la fila.
          items: {
            take: 1,
            orderBy: { id: "asc" },
            select: {
              nombreProducto: true,
              variante: {
                select: {
                  producto: {
                    select: {
                      imagenes: { take: 1, orderBy: { orden: "asc" }, select: { url: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      ctx.prisma.pedido.groupBy({ by: ["estado"], _count: { _all: true } }),
    ]);

    // Unidades por pedido: la suma de las cantidades de sus lineas.
    const unidades = new Map(
      (
        await ctx.prisma.itemPedido.groupBy({
          by: ["pedidoId"],
          where: { pedidoId: { in: filas.map((p) => p.id) } },
          _sum: { cantidad: true },
        })
      ).map((g) => [g.pedidoId, g._sum.cantidad ?? 0]),
    );

    const porEstado = Object.fromEntries(ESTADOS_PEDIDO.map((e) => [e, 0])) as Record<
      EstadoPedido,
      number
    >;
    for (const fila of conteo) porEstado[fila.estado] = fila._count._all;

    return {
      porEstado,
      pedidos: filas.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        estado: p.estado,
        total: Number(p.total),
        medioPago: p.medioPago,
        creadoEn: p.creadoEn.toISOString(),
        departamento: p.envioDepartamento,
        cliente: p.usuario.nombre,
        email: p.usuario.email,
        lineas: p._count.items,
        unidades: unidades.get(p.id) ?? 0,
        // Pendiente de pago, pero el cliente ya envio su comprobante: falta que el equipo lo confirme.
        porConfirmar:
          p.estado === "PENDIENTE_PAGO" &&
          p.medioPago !== "CONTRA_ENTREGA" &&
          p.pagos.some((g) => g.referencia !== null || g.comprobanteUrl !== null),
        primerProducto: p.items[0]?.nombreProducto ?? null,
        imagen: p.items[0]?.variante.producto.imagenes[0]?.url ?? null,
      })),
    };
  }),

  /**
   * Tarjetas de la seccion: la cola por preparar (ahora, sin comparar) y los
   * pedidos creados, entregados y cancelados del periodo contra el anterior.
   * Entregado y cancelado cuentan por la fecha del cambio en el historial.
   */
  metricas: ver.input(esquemaMetricasPedidos).query(async ({ ctx, input }) => {
    const ahora = new Date();
    const periodo = input.fecha
      ? ventanaDeFecha(input.fecha, ahora)
      : ventanaDe(input.periodo, ahora);
    const hasta = periodo.hasta ?? periodo.fin;
    const rango = { gte: periodo.previoDesde, lt: hasta };

    const [creados, cambios, porPreparar, masAntiguo] = await Promise.all([
      ctx.prisma.pedido.findMany({ where: { creadoEn: rango }, select: { creadoEn: true } }),
      ctx.prisma.historialPedido.findMany({
        where: { creadoEn: rango, estadoNuevo: { in: ["PAGADO", "ENTREGADO", "CANCELADO"] } },
        select: { estadoNuevo: true, creadoEn: true },
      }),
      ctx.prisma.pedido.count({ where: { estado: "PAGADO" } }),
      ctx.prisma.pedido.findFirst({
        where: { estado: "PAGADO" },
        orderBy: { creadoEn: "asc" },
        select: { creadoEn: true },
      }),
    ]);

    const fechasDe = (estado: EstadoPedido) =>
      cambios.filter((c) => c.estadoNuevo === estado).map((c) => c.creadoEn);
    /** Una cifra contada contra el periodo anterior, con sus dos series. */
    const comparar = (fechas: Date[]) => {
      const actual = fechas
        .filter((en) => en >= periodo.desde && en < hasta)
        .map((en) => ({ en, valor: 1 }));
      const previo = fechas
        .filter((en) => en >= periodo.previoDesde && en < periodo.previoHasta)
        .map((en) => ({ en, valor: 1 }));
      return {
        cantidad: actual.length,
        cantidadPrevia: previo.length,
        cambio: variacion(actual.length, previo.length),
        serie: serieAcumulada(actual, periodo.desde, periodo.fin, ahora),
        seriePrevia: serieAcumulada(previo, periodo.previoDesde, periodo.previoHasta),
      };
    };

    return {
      titulo: periodo.titulo,
      etiquetaAnterior: periodo.etiquetaPrevio,
      porPreparar: {
        cantidad: porPreparar,
        masAntiguo: masAntiguo?.creadoEn.toISOString() ?? null,
        // Los pagos que entraron a la cola en el periodo: de donde sale su ritmo.
        serie: comparar(fechasDe("PAGADO")).serie,
      },
      creados: comparar(creados.map((p) => p.creadoEn)),
      entregados: comparar(fechasDe("ENTREGADO")),
      cancelados: comparar(fechasDe("CANCELADO")),
    };
  }),

  detalle: ver.input(esquemaIdPedido).query(async ({ ctx, input }) => {
    const p = await ctx.prisma.pedido.findUnique({
      where: { id: input.pedidoId },
      include: {
        usuario: { select: { nombre: true, email: true, telefono: true } },
        items: { include: { variante: { select: { stock: true } } } },
        pagos: {
          orderBy: { creadoEn: "asc" },
          include: { confirmadoPor: { select: { nombre: true } } },
        },
        historial: {
          orderBy: { creadoEn: "asc" },
          include: { usuario: { select: { nombre: true } } },
        },
      },
    });
    if (p === null) throw new TRPCError({ code: "NOT_FOUND", message: "Ese pedido no existe." });

    return {
      id: p.id,
      codigo: p.codigo,
      estado: p.estado,
      medioPago: p.medioPago,
      creadoEn: p.creadoEn.toISOString(),
      subtotal: Number(p.subtotal),
      descuento: Number(p.descuento),
      costoEnvio: Number(p.costoEnvio),
      total: Number(p.total),
      cuponCodigo: p.cuponCodigo,
      cliente: p.usuario,
      envio: {
        destinatario: p.envioDestinatario,
        telefono: p.envioTelefono,
        direccion: [p.envioCalle, p.envioDistrito, p.envioProvincia, p.envioDepartamento].join(
          ", ",
        ),
        referencia: p.envioReferencia,
        metodo: p.envioMetodo,
        transportista: p.transportista,
        codigoSeguimiento: p.codigoSeguimiento,
      },
      comprobante: { tipo: p.comprobante, documento: p.documento, razonSocial: p.razonSocial },
      items: p.items.map((i) => ({
        nombreProducto: i.nombreProducto,
        sku: i.sku,
        talla: i.talla,
        color: i.color,
        precioUnitario: Number(i.precioUnitario),
        cantidad: i.cantidad,
        stockActual: i.variante.stock,
      })),
      pagos: p.pagos.map((pago) => ({
        id: pago.id,
        medio: pago.medio,
        monto: Number(pago.monto),
        estado: pago.estado,
        referencia: pago.referencia,
        comprobanteUrl: pago.comprobanteUrl,
        confirmadoPor: pago.confirmadoPor?.nombre ?? null,
        confirmadoEn: pago.confirmadoEn?.toISOString() ?? null,
      })),
      historial: p.historial.map((h) => ({
        id: h.id,
        estadoAnterior: h.estadoAnterior,
        estadoNuevo: h.estadoNuevo,
        nota: h.nota,
        usuario: h.usuario?.nombre ?? null,
        creadoEn: h.creadoEn.toISOString(),
      })),
    };
  }),

  /** PENDIENTE_PAGO -> PAGADO, con numero de operacion. Descuenta el stock. */
  confirmarPago: gestionar.input(esquemaConfirmarPago).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.findUnique({
          where: { id: input.pedidoId },
          include: { items: true, pagos: { where: { id: input.pagoId } } },
        });
        const pago = pedido?.pagos[0];
        if (!pedido || !pago)
          throw new TRPCError({ code: "NOT_FOUND", message: "Ese pago no existe." });

        const rechazo = revisarConfirmacionPago({
          estadoPedido: pedido.estado,
          estadoPago: pago.estado,
          medio: pago.medio,
          referencia: input.referencia,
        });
        if (rechazo !== null) rechazar(mensajeDeRechazoPedido(rechazo));

        await comprobarStock(tx, pedido.items);
        await moverEstado(tx, pedido.id, pedido.estado, { estado: "PAGADO" });

        await tx.pago.update({
          where: { id: pago.id },
          data: {
            estado: "CONFIRMADO",
            referencia: input.referencia,
            confirmadoPorId: ctx.sesion.usuarioId,
            confirmadoEn: new Date(),
          },
        });

        const tocados = await aplicarMovimientos(
          tx,
          movimientosDelCambio(pedido.estado, "PAGADO", pedido.items, pedido.id),
        );

        await tx.historialPedido.create({
          data: {
            pedidoId: pedido.id,
            estadoAnterior: pedido.estado,
            estadoNuevo: "PAGADO",
            usuarioId: ctx.sesion.usuarioId,
            nota: notaDeCambio("PAGADO", {
              medio: pago.medio,
              referencia: input.referencia,
              nota: input.nota ?? null,
            }),
          },
        });

        return { codigo: pedido.codigo, productosTocados: tocados };
      });
    } catch (error) {
      traducirError(error);
    }
  }),

  /** Cualquier otro cambio: preparar, enviar, entregar, cancelar. */
  cambiarEstado: gestionar
    .input(esquemaCambioEstadoPedido)
    .mutation(({ ctx, input }) =>
      ejecutarCambioEstado(ctx.prisma, ctx.sesion.usuarioId, input, revisarCambioEstado),
    ),
});
