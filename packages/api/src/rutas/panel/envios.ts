/**
 * Envios del panel: la cola de despacho del almacen y las tarifas de envio.
 *
 * El almacen (`despachar_envios`) ve que preparar y a donde mandarlo, y mueve
 * el pedido por los pasos de `revisarDespacho`: preparar, enviar, entregar.
 * No ve montos ni puede cancelar. Las tarifas son de `gestionar_ajustes`.
 */

import { ESTADOS_DESPACHO, revisarDespacho, type EstadoPedido } from "@appweb/core";
import { esquemaCambioEstadoPedido, esquemaMetodoEnvio } from "@appweb/core/tipos";

import { rechazar } from "../../stock";
import { exige, router } from "../../trpc";
import { ejecutarCambioEstado } from "./pedidos";

const despachar = exige("despachar_envios");
const ajustar = exige("gestionar_ajustes");

export const envios = router({
  /** Pedidos por preparar, en preparacion y en camino; los mas viejos primero. */
  cola: despachar.query(async ({ ctx }) => {
    const pedidos = await ctx.prisma.pedido.findMany({
      where: { estado: { in: [...ESTADOS_DESPACHO] } },
      orderBy: { creadoEn: "asc" },
      take: 200,
      select: {
        id: true,
        codigo: true,
        estado: true,
        medioPago: true,
        creadoEn: true,
        envioDestinatario: true,
        envioTelefono: true,
        envioDepartamento: true,
        envioProvincia: true,
        envioDistrito: true,
        envioCalle: true,
        envioReferencia: true,
        envioMetodo: true,
        transportista: true,
        codigoSeguimiento: true,
        usuario: { select: { nombre: true, telefono: true } },
        items: {
          select: { nombreProducto: true, sku: true, talla: true, color: true, cantidad: true },
        },
      },
    });

    return pedidos.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      estado: p.estado as EstadoPedido,
      // Para el repartidor: si tiene que cobrar al entregar.
      cobrarAlEntregar: p.medioPago === "CONTRA_ENTREGA",
      creadoEn: p.creadoEn.toISOString(),
      destinatario: p.envioDestinatario ?? p.usuario.nombre,
      telefono: p.envioTelefono ?? p.usuario.telefono,
      direccion: [p.envioCalle, p.envioDistrito, p.envioProvincia, p.envioDepartamento].join(", "),
      referencia: p.envioReferencia,
      metodo: p.envioMetodo,
      transportista: p.transportista,
      codigoSeguimiento: p.codigoSeguimiento,
      items: p.items,
    }));
  }),

  /** Un paso del despacho. Misma transaccion que Pedidos, otra regla. */
  avanzar: despachar
    .input(esquemaCambioEstadoPedido)
    .mutation(({ ctx, input }) =>
      ejecutarCambioEstado(ctx.prisma, ctx.sesion.usuarioId, input, revisarDespacho),
    ),

  metodos: ajustar.query(async ({ ctx }) => {
    const metodos = await ctx.prisma.metodoEnvio.findMany({
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });
    return metodos.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      costo: Number(m.costo),
      gratisDesde: m.gratisDesde === null ? null : Number(m.gratisDesde),
      departamentos: m.departamentos,
      activo: m.activo,
      orden: m.orden,
    }));
  }),

  /** Crea o actualiza un metodo. Los metodos no se borran: los pedidos guardan su nombre. */
  guardarMetodo: ajustar.input(esquemaMetodoEnvio).mutation(async ({ ctx, input }) => {
    const datos = {
      nombre: input.nombre,
      costo: input.costo,
      gratisDesde: input.gratisDesde,
      departamentos: input.departamentos,
      activo: input.activo,
      orden: input.orden,
    };
    if (input.metodoId) {
      const existe = await ctx.prisma.metodoEnvio.findUnique({ where: { id: input.metodoId } });
      if (existe === null) rechazar("Ese método de envío no existe.", "NOT_FOUND");
      await ctx.prisma.metodoEnvio.update({ where: { id: input.metodoId }, data: datos });
    } else {
      await ctx.prisma.metodoEnvio.create({ data: datos });
    }
    return { ok: true };
  }),
});
