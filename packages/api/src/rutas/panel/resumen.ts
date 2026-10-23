/**
 * Resumen del panel: lo que hay que mirar al entrar.
 *
 * Tres niveles, en este orden: que necesita atencion ahora (alertas), como va
 * el negocio (metricas del periodo contra el anterior entero) y que paso
 * ultimamente.
 *
 * Los bloques se arman segun el rol y no segun lo que pida la pantalla: un
 * ALMACEN no tiene `ver_ventas`, asi que sus metricas y sus ultimos pedidos
 * vienen vacios aunque el panel los pida. Esconderlos en el cliente no seria
 * seguridad.
 */

import {
  diasDesde,
  ESTADOS_PENDIENTES,
  ESTADOS_VENTA,
  puede,
  seriesDelResumen,
  UMBRAL_STOCK_BAJO,
  variacion,
  ventanaDe,
  ventanaDeFecha,
  type EstadoPedido,
} from "@appweb/core";
import { esquemaResumen } from "@appweb/core/tipos";

import { exige, router } from "../../trpc";

const entrar = exige("entrar_panel");

/** Cuantas filas trae cada lista del resumen: es un vistazo, no un listado. */
const TOPE_LISTA = 5;

export const resumen = router({
  datos: entrar.input(esquemaResumen).query(async ({ ctx, input }) => {
    const { rol } = ctx.sesion;
    const verVentas = puede(rol, "ver_ventas");
    const verStock = puede(rol, "ajustar_stock");

    const periodo = input.fecha ? ventanaDeFecha(input.fecha) : ventanaDe(input.periodo);

    const estadosVenta = [...ESTADOS_VENTA];
    // Un dia pasado tiene fin; los periodos en curso llegan hasta ahora.
    const ventana = { gte: periodo.desde, ...(periodo.hasta ? { lt: periodo.hasta } : {}) };
    // Se compara contra el periodo anterior entero: "hoy" contra todo "ayer".
    const ventanaPrevia = { gte: periodo.previoDesde, lt: periodo.previoHasta };

    const ahora = new Date();

    // Todo en un viaje: ninguna de estas consultas depende de otra.
    const [
      pedidosPendientes,
      variantesBajas,
      pedidosVentana,
      pedidosVentanaPrevia,
      clientesNuevos,
      clientesNuevosPrevios,
      ultimosPedidos,
      ultimosUsuarios,
      pedidosSerie,
      altasSerie,
      pedidosSeriePrevia,
      altasSeriePrevia,
    ] = await Promise.all([
      verVentas
        ? ctx.prisma.pedido.findMany({
            where: { estado: { in: [...ESTADOS_PENDIENTES] } },
            // Los mas viejos primero: son los que llevan mas tiempo esperando.
            orderBy: { creadoEn: "asc" },
            take: TOPE_LISTA,
            select: { id: true, codigo: true, total: true, estado: true, creadoEn: true },
          })
        : [],
      verStock
        ? ctx.prisma.variante.findMany({
            where: { activo: true, stock: { lte: UMBRAL_STOCK_BAJO } },
            orderBy: { stock: "asc" },
            take: TOPE_LISTA,
            select: {
              id: true,
              talla: true,
              color: true,
              stock: true,
              producto: { select: { nombre: true } },
            },
          })
        : [],
      verVentas
        ? ctx.prisma.pedido.aggregate({
            where: { estado: { in: estadosVenta }, creadoEn: ventana },
            _sum: { total: true },
            _count: true,
          })
        : null,
      verVentas
        ? ctx.prisma.pedido.aggregate({
            where: { estado: { in: estadosVenta }, creadoEn: ventanaPrevia },
            _sum: { total: true },
            _count: true,
          })
        : null,
      verVentas ? ctx.prisma.usuario.count({ where: { creadoEn: ventana } }) : 0,
      verVentas ? ctx.prisma.usuario.count({ where: { creadoEn: ventanaPrevia } }) : 0,
      verVentas
        ? ctx.prisma.pedido.findMany({
            orderBy: { creadoEn: "desc" },
            take: TOPE_LISTA,
            select: { id: true, codigo: true, total: true, estado: true, creadoEn: true },
          })
        : [],
      puede(rol, "gestionar_usuarios")
        ? ctx.prisma.usuario.findMany({
            orderBy: { creadoEn: "desc" },
            take: TOPE_LISTA,
            select: { id: true, nombre: true, email: true, creadoEn: true },
          })
        : [],
      // Para los minigraficos: cada venta y cada alta del periodo con su hora.
      verVentas
        ? ctx.prisma.pedido.findMany({
            where: { estado: { in: estadosVenta }, creadoEn: ventana },
            select: { creadoEn: true, total: true },
          })
        : [],
      verVentas
        ? ctx.prisma.usuario.findMany({ where: { creadoEn: ventana }, select: { creadoEn: true } })
        : [],
      // Y las del periodo anterior entero, para la linea punteada.
      verVentas
        ? ctx.prisma.pedido.findMany({
            where: { estado: { in: estadosVenta }, creadoEn: ventanaPrevia },
            select: { creadoEn: true, total: true },
          })
        : [],
      verVentas
        ? ctx.prisma.usuario.findMany({
            where: { creadoEn: ventanaPrevia },
            select: { creadoEn: true },
          })
        : [],
    ]);

    const ventas = Number(pedidosVentana?._sum.total ?? 0);
    const ventasPrevias = Number(pedidosVentanaPrevia?._sum.total ?? 0);
    const cantidadPedidos = pedidosVentana?._count ?? 0;
    const cantidadPedidosPrevios = pedidosVentanaPrevia?._count ?? 0;
    const ticket = cantidadPedidos > 0 ? ventas / cantidadPedidos : 0;
    const ticketPrevio = cantidadPedidosPrevios > 0 ? ventasPrevias / cantidadPedidosPrevios : 0;

    // Las dos lineas comparten el eje del periodo entero: la actual se corta
    // en ahora y la anterior llega completa, asi se ve cuanto falta.
    const series = seriesDelResumen(
      pedidosSerie.map((p) => ({ en: p.creadoEn, total: Number(p.total) })),
      altasSerie.map((u) => u.creadoEn),
      periodo.desde,
      periodo.fin,
      ahora,
    );
    const seriesPrevias = seriesDelResumen(
      pedidosSeriePrevia.map((p) => ({ en: p.creadoEn, total: Number(p.total) })),
      altasSeriePrevia.map((u) => u.creadoEn),
      periodo.previoDesde,
      periodo.previoHasta,
    );

    return {
      titulo: periodo.titulo,
      contexto: periodo.contexto,
      etiquetaAnterior: periodo.etiquetaPrevio,
      alertas: {
        pedidosPendientes: pedidosPendientes.map((pedido) => ({
          id: pedido.id,
          codigo: pedido.codigo,
          total: Number(pedido.total),
          estado: pedido.estado as EstadoPedido,
          dias: diasDesde(pedido.creadoEn, ahora),
        })),
        variantesBajas: variantesBajas.map((variante) => ({
          id: variante.id,
          nombre: variante.producto.nombre,
          talla: variante.talla,
          color: variante.color,
          stock: variante.stock,
        })),
      },
      metricas: verVentas
        ? {
            ventas,
            cambioVentas: variacion(ventas, ventasPrevias),
            serieVentas: series.ventas,
            serieVentasPrevia: seriesPrevias.ventas,
            diferenciaVentas: ventas - ventasPrevias,
            pedidos: cantidadPedidos,
            cambioPedidos: variacion(cantidadPedidos, cantidadPedidosPrevios),
            seriePedidos: series.pedidos,
            seriePedidosPrevia: seriesPrevias.pedidos,
            diferenciaPedidos: cantidadPedidos - cantidadPedidosPrevios,
            ticket,
            cambioTicket: variacion(ticket, ticketPrevio),
            serieTicket: series.ticket,
            serieTicketPrevia: seriesPrevias.ticket,
            diferenciaTicket: ticket - ticketPrevio,
            clientesNuevos,
            cambioClientesNuevos: variacion(clientesNuevos, clientesNuevosPrevios),
            serieClientesNuevos: series.clientesNuevos,
            serieClientesNuevosPrevia: seriesPrevias.clientesNuevos,
            diferenciaClientesNuevos: clientesNuevos - clientesNuevosPrevios,
            anteriores: {
              ventas: ventasPrevias,
              pedidos: cantidadPedidosPrevios,
              ticket: ticketPrevio,
              clientesNuevos: clientesNuevosPrevios,
            },
          }
        : null,
      ultimosPedidos: ultimosPedidos.map((pedido) => ({
        id: pedido.id,
        codigo: pedido.codigo,
        total: Number(pedido.total),
        estado: pedido.estado as EstadoPedido,
        creadoEn: pedido.creadoEn.toISOString(),
      })),
      ultimosUsuarios: ultimosUsuarios.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      })),
    };
  }),
});
