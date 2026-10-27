/**
 * Envios del panel: la cola de despacho del almacen y las tarifas de envio.
 *
 * El almacen (`despachar_envios`) ve que preparar y a donde mandarlo, y mueve
 * el pedido por los pasos de `revisarDespacho`: preparar, enviar, entregar.
 * No ve montos ni puede cancelar. Las tarifas son de `gestionar_ajustes`.
 */

import {
  ESTADOS_DESPACHO,
  estaDemorado,
  revisarDespacho,
  serieAcumulada,
  variacion,
  ventanaDe,
  ventanaDeFecha,
  type EstadoPedido,
} from "@appweb/core";
import {
  esquemaCambioEstadoPedido,
  esquemaMetodoEnvio,
  esquemaMetricasEnvios,
} from "@appweb/core/tipos";
import { z } from "zod";

import { rechazar } from "../../stock";
import { exige, router } from "../../trpc";
import { ejecutarCambioEstado } from "./pedidos";

const despachar = exige("despachar_envios");
const ajustar = exige("gestionar_ajustes");

export const envios = router({
  /**
   * Pedidos por preparar, en preparacion y en camino; los mas viejos primero.
   * Con `historial`, los ya entregados: los ultimos 100, el mas reciente arriba.
   */
  cola: despachar
    .input(z.object({ historial: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const historial = input?.historial === true;
      const pedidos = await ctx.prisma.pedido.findMany({
        where: historial ? { estado: "ENTREGADO" } : { estado: { in: [...ESTADOS_DESPACHO] } },
        orderBy: historial ? { entregadoEn: { sort: "desc", nulls: "last" } } : { creadoEn: "asc" },
        take: historial ? 100 : 200,
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
          // El recorrido del paquete: cuando paso por cada paso del despacho.
          historial: {
            orderBy: { creadoEn: "asc" },
            select: { estadoNuevo: true, creadoEn: true, usuario: { select: { nombre: true } } },
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
        direccion: [p.envioCalle, p.envioDistrito, p.envioProvincia, p.envioDepartamento].join(
          ", ",
        ),
        distrito: p.envioDistrito,
        departamento: p.envioDepartamento,
        referencia: p.envioReferencia,
        metodo: p.envioMetodo,
        transportista: p.transportista,
        codigoSeguimiento: p.codigoSeguimiento,
        items: p.items,
        recorrido: p.historial.map((h) => ({
          estado: h.estadoNuevo as EstadoPedido,
          usuario: h.usuario?.nombre ?? null,
          creadoEn: h.creadoEn.toISOString(),
        })),
      }));
    }),

  /**
   * Tarjetas de la seccion. Tres colas de ahora mismo (por despachar, en
   * camino, demorados) y los despachados del periodo contra el anterior.
   * Sin montos: el almacen no los ve.
   */
  metricas: despachar.input(esquemaMetricasEnvios).query(async ({ ctx, input }) => {
    const ahora = new Date();
    const periodo = input.fecha
      ? ventanaDeFecha(input.fecha, ahora)
      : ventanaDe(input.periodo, ahora);
    const hasta = periodo.hasta ?? periodo.fin;

    const [enCurso, pasos] = await Promise.all([
      // Cada pedido con la fecha en que entro a su estado actual.
      ctx.prisma.pedido.findMany({
        where: { estado: { in: ["PREPARANDO", "ENVIADO"] } },
        select: {
          estado: true,
          creadoEn: true,
          historial: {
            where: { estadoNuevo: { in: ["PREPARANDO", "ENVIADO"] } },
            orderBy: { creadoEn: "desc" },
            take: 1,
            select: { creadoEn: true },
          },
        },
      }),
      ctx.prisma.historialPedido.findMany({
        where: {
          creadoEn: { gte: periodo.previoDesde, lt: hasta },
          estadoNuevo: { in: ["PREPARANDO", "ENVIADO"] },
        },
        select: { estadoNuevo: true, creadoEn: true },
      }),
    ]);

    const desde = (p: (typeof enCurso)[number]) => p.historial[0]?.creadoEn ?? p.creadoEn;
    /** Una cola de ahora: cuantos hay y desde cuando espera el mas antiguo. */
    const cola = (estado: EstadoPedido, fechas: Date[]) => {
      const serie = pasos
        .filter(
          (c) => c.estadoNuevo === estado && c.creadoEn >= periodo.desde && c.creadoEn < hasta,
        )
        .map((c) => ({ en: c.creadoEn, valor: 1 }));
      const masAntiguo = fechas.reduce<Date | null>((min, f) => (min && min < f ? min : f), null);
      return {
        cantidad: fechas.length,
        masAntiguo: masAntiguo?.toISOString() ?? null,
        // Los que entraron a la cola en el periodo: de donde sale su ritmo.
        serie: serieAcumulada(serie, periodo.desde, periodo.fin, ahora),
      };
    };
    const fechasDe = (estado: EstadoPedido) =>
      enCurso.filter((p) => p.estado === estado).map(desde);

    const enviados = pasos.filter((c) => c.estadoNuevo === "ENVIADO").map((c) => c.creadoEn);
    const actual = enviados
      .filter((en) => en >= periodo.desde && en < hasta)
      .map((en) => ({ en, valor: 1 }));
    const previo = enviados
      .filter((en) => en >= periodo.previoDesde && en < periodo.previoHasta)
      .map((en) => ({ en, valor: 1 }));
    const demorados = fechasDe("ENVIADO").filter((f) => estaDemorado(f, ahora));

    return {
      titulo: periodo.titulo,
      etiquetaAnterior: periodo.etiquetaPrevio,
      porDespachar: cola("PREPARANDO", fechasDe("PREPARANDO")),
      enCamino: cola("ENVIADO", fechasDe("ENVIADO")),
      demorados: {
        cantidad: demorados.length,
        masAntiguo:
          demorados
            .reduce<Date | null>((min, f) => (min && min < f ? min : f), null)
            ?.toISOString() ?? null,
      },
      despachados: {
        cantidad: actual.length,
        cantidadPrevia: previo.length,
        cambio: variacion(actual.length, previo.length),
        serie: serieAcumulada(actual, periodo.desde, periodo.fin, ahora),
        seriePrevia: serieAcumulada(previo, periodo.previoDesde, periodo.previoHasta),
      },
    };
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
