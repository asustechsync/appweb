/**
 * Devoluciones, cambios y reembolsos del panel.
 *
 * No hay tabla propia (ver `pedidos/devoluciones.ts` de @appweb/core): una
 * devolucion son sus movimientos de stock, su pago REEMBOLSADO y una linea de
 * historial que no cambia el estado, escritos en UNA transaccion. Por eso la
 * lista se arma desde el historial y junta lo demas por pedido y fecha.
 */

import { TRPCError } from "@trpc/server";

import {
  ESTADOS_CON_DEVOLUCION,
  mensajeDeRechazoDevolucion,
  movimientosDeDevolucion,
  notaDeDevolucion,
  revisarDevolucion,
  tipoDeDevolucion,
  type LineaDevolucion,
  type TipoDevolucion,
} from "@appweb/core";
import { esquemaBuscarPedido, esquemaDevolucion } from "@appweb/core/tipos";
import { Prisma } from "@appweb/db";

import { aplicarMovimientos, esStockNegativo, rechazar, type Transaccion } from "../../stock";
import { exige, router } from "../../trpc";

const ver = exige("ver_ventas");
const gestionar = exige("cambiar_estado_pedido");

const TOPE_LISTA = 100;

/** Unidades ya devueltas por variante: los DEVOLUCION del pedido entregado. */
async function devueltasPorVariante(tx: Transaccion, pedidoId: string) {
  const filas = await tx.movimientoStock.groupBy({
    by: ["varianteId"],
    where: { pedidoId, motivo: "DEVOLUCION" },
    _sum: { delta: true },
  });
  return new Map(filas.map((f) => [f.varianteId, f._sum.delta ?? 0]));
}

/** Lo cobrado que aun no se devolvio: el tope de un reembolso nuevo. */
async function reembolsable(tx: Transaccion, pedidoId: string) {
  const filas = await tx.pago.groupBy({
    by: ["estado"],
    where: { pedidoId, estado: { in: ["CONFIRMADO", "REEMBOLSADO"] } },
    _sum: { monto: true },
  });
  const suma = (estado: string) => Number(filas.find((f) => f.estado === estado)?._sum.monto ?? 0);
  return Math.max(suma("CONFIRMADO") - suma("REEMBOLSADO"), 0);
}

export const devoluciones = router({
  /** Las devoluciones registradas, de la mas nueva a la mas vieja. */
  listar: ver.query(async ({ ctx }) => {
    const filas = await ctx.prisma.historialPedido.findMany({
      where: {
        OR: ESTADOS_CON_DEVOLUCION.map((e) => ({ estadoAnterior: e, estadoNuevo: e })),
      },
      orderBy: { creadoEn: "desc" },
      take: TOPE_LISTA,
      include: {
        usuario: { select: { nombre: true } },
        pedido: { select: { id: true, codigo: true, usuario: { select: { nombre: true } } } },
      },
    });
    if (filas.length === 0) return { devoluciones: [] };

    // Lo escrito en la misma transaccion comparte `creadoEn` (now() de Postgres).
    const pedidoIds = [...new Set(filas.map((f) => f.pedidoId))];
    const [movimientos, reembolsos] = await Promise.all([
      ctx.prisma.movimientoStock.findMany({
        where: { pedidoId: { in: pedidoIds }, motivo: { in: ["DEVOLUCION", "VENTA"] } },
        select: {
          pedidoId: true,
          delta: true,
          motivo: true,
          creadoEn: true,
          variante: {
            select: { talla: true, color: true, producto: { select: { nombre: true } } },
          },
        },
      }),
      ctx.prisma.pago.findMany({
        where: { pedidoId: { in: pedidoIds }, estado: "REEMBOLSADO" },
        select: { pedidoId: true, monto: true, creadoEn: true },
      }),
    ]);
    const clave = (pedidoId: string | null, fecha: Date) => `${pedidoId}|${fecha.getTime()}`;

    return {
      devoluciones: filas.map((h) => {
        const k = clave(h.pedidoId, h.creadoEn);
        const propios = movimientos.filter((m) => clave(m.pedidoId, m.creadoEn) === k);
        const vuelven = propios.filter((m) => m.motivo === "DEVOLUCION");
        const salen = propios.filter((m) => m.motivo === "VENTA");
        const reembolso = reembolsos
          .filter((r) => clave(r.pedidoId, r.creadoEn) === k)
          .reduce((suma, r) => suma + Number(r.monto), 0);
        const tipo: TipoDevolucion =
          salen.length > 0 ? "CAMBIO" : vuelven.length > 0 ? "DEVOLUCION" : "REEMBOLSO";
        const describir = (m: (typeof propios)[number]) =>
          `${Math.abs(m.delta)} × ${m.variante.producto.nombre} (${m.variante.talla}, ${m.variante.color})`;

        return {
          id: h.id,
          tipo,
          pedidoId: h.pedido.id,
          codigo: h.pedido.codigo,
          cliente: h.pedido.usuario.nombre,
          vuelven: vuelven.map(describir),
          salen: salen.map(describir),
          reembolso,
          nota: h.nota,
          usuario: h.usuario?.nombre ?? null,
          creadoEn: h.creadoEn.toISOString(),
        };
      }),
    };
  }),

  /** Un pedido por su codigo, con lo que todavia se puede devolver o cambiar. */
  pedido: ver.input(esquemaBuscarPedido).query(async ({ ctx, input }) => {
    const p = await ctx.prisma.pedido.findUnique({
      where: { codigo: input.codigo.toUpperCase() },
      include: {
        usuario: { select: { nombre: true } },
        items: {
          include: {
            variante: {
              select: {
                productoId: true,
                producto: {
                  select: {
                    variantes: {
                      where: { activo: true },
                      orderBy: [{ color: "asc" }, { talla: "asc" }],
                      select: { id: true, talla: true, color: true, stock: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (p === null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No hay un pedido con ese código." });
    }

    const [devueltas, tope] = await Promise.all([
      devueltasPorVariante(ctx.prisma, p.id),
      reembolsable(ctx.prisma, p.id),
    ]);
    const cancelado = p.estado === "CANCELADO";

    return {
      id: p.id,
      codigo: p.codigo,
      estado: p.estado,
      medioPago: p.medioPago,
      cliente: p.usuario.nombre,
      total: Number(p.total),
      reembolsable: tope,
      admiteDevolucion: ESTADOS_CON_DEVOLUCION.includes(p.estado),
      items: p.items.map((i) => ({
        varianteId: i.varianteId,
        nombreProducto: i.nombreProducto,
        talla: i.talla,
        color: i.color,
        cantidad: i.cantidad,
        precioUnitario: Number(i.precioUnitario),
        // En un cancelado los DEVOLUCION son los de la cancelacion: no cuentan.
        disponibles: cancelado ? 0 : Math.max(i.cantidad - (devueltas.get(i.varianteId) ?? 0), 0),
        opcionesCambio: i.variante.producto.variantes.filter((v) => v.id !== i.varianteId),
      })),
    };
  }),

  /** Registra la devolucion: stock, reembolso e historial en una transaccion. */
  registrar: gestionar.input(esquemaDevolucion).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.findUnique({
          where: { id: input.pedidoId },
          include: { items: { include: { variante: { select: { productoId: true } } } } },
        });
        if (pedido === null) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ese pedido no existe." });
        }

        const reemplazoIds = input.lineas.flatMap((l) =>
          l.reemplazoVarianteId && l.cantidad > 0 ? [l.reemplazoVarianteId] : [],
        );
        const [devueltas, tope, reemplazos] = await Promise.all([
          devueltasPorVariante(tx, pedido.id),
          reembolsable(tx, pedido.id),
          tx.variante.findMany({
            where: { id: { in: reemplazoIds } },
            select: { id: true, productoId: true, stock: true },
          }),
        ]);

        const lineas: LineaDevolucion[] = [];
        for (const l of input.lineas) {
          const vendidas = pedido.items
            .filter((i) => i.varianteId === l.varianteId)
            .reduce((suma, i) => suma + i.cantidad, 0);
          const item = pedido.items.find((i) => i.varianteId === l.varianteId);
          if (item === undefined) rechazar("Esa prenda no es de este pedido.");
          const reemplazo = l.reemplazoVarianteId
            ? reemplazos.find((v) => v.id === l.reemplazoVarianteId)
            : undefined;
          if (l.reemplazoVarianteId && l.cantidad > 0 && reemplazo === undefined) {
            rechazar("La talla o color del cambio ya no existe.");
          }
          lineas.push({
            varianteId: l.varianteId,
            vendidas,
            yaDevueltas: devueltas.get(l.varianteId) ?? 0,
            aDevolver: l.cantidad,
            ...(reemplazo
              ? {
                  reemplazo: {
                    varianteId: reemplazo.id,
                    mismoProducto: reemplazo.productoId === item.variante.productoId,
                    stock: reemplazo.stock,
                  },
                }
              : {}),
          });
        }

        const referencia = input.referencia?.trim() || null;
        const rechazo = revisarDevolucion({
          estadoPedido: pedido.estado,
          medio: pedido.medioPago,
          lineas,
          reembolso: input.reembolso,
          reembolsable: tope,
          referencia,
          motivo: input.motivo,
        });
        if (rechazo !== null) rechazar(mensajeDeRechazoDevolucion(rechazo));

        const tocados = await aplicarMovimientos(
          tx,
          movimientosDeDevolucion(lineas, pedido.id, input.motivo),
          ctx.sesion.usuarioId,
        );

        if (input.reembolso > 0) {
          await tx.pago.create({
            data: {
              pedidoId: pedido.id,
              medio: pedido.medioPago,
              monto: input.reembolso,
              estado: "REEMBOLSADO",
              referencia,
              confirmadoPorId: ctx.sesion.usuarioId,
              confirmadoEn: new Date(),
            },
          });
        }

        const activas = lineas.filter((l) => l.aDevolver > 0);
        await tx.historialPedido.create({
          data: {
            pedidoId: pedido.id,
            estadoAnterior: pedido.estado,
            estadoNuevo: pedido.estado,
            usuarioId: ctx.sesion.usuarioId,
            nota: notaDeDevolucion({
              devueltas: activas.reduce((s, l) => s + l.aDevolver, 0),
              cambiadas: activas.filter((l) => l.reemplazo).reduce((s, l) => s + l.aDevolver, 0),
              reembolso: input.reembolso,
              medio: pedido.medioPago,
              referencia,
              motivo: input.motivo,
            }),
          },
        });

        return { codigo: pedido.codigo, tipo: tipoDeDevolucion(lineas), productosTocados: tocados };
      });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        rechazar("Ese número de operación ya se usó en otro pago.", "CONFLICT");
      }
      if (esStockNegativo(error)) {
        rechazar("Otra venta se llevó la última unidad de la talla del cambio.", "CONFLICT");
      }
      throw error;
    }
  }),
});
