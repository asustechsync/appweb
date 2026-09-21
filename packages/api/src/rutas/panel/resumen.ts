/**
 * Resumen del panel: lo que hay que mirar al entrar.
 *
 * Tres niveles, en este orden: que necesita atencion ahora (alertas), como va
 * el negocio (metricas de 7 dias contra los 7 previos) y que paso ultimamente.
 *
 * Los bloques se arman segun el rol y no segun lo que pida la pantalla: un
 * ALMACEN no tiene `ver_ventas`, asi que sus metricas y sus ultimos pedidos
 * vienen vacios aunque el panel los pida. Esconderlos en el cliente no seria
 * seguridad.
 */

import {
  diasDesde,
  DIAS_VENTANA,
  ESTADOS_PENDIENTES,
  ESTADOS_VENTA,
  inicioDeHace,
  puede,
  UMBRAL_STOCK_BAJO,
  variacion,
  type EstadoPedido,
} from "@appweb/core";

import { exige, router } from "../../trpc";

const entrar = exige("entrar_panel");

/** Cuantas filas trae cada lista del resumen: es un vistazo, no un listado. */
const TOPE_LISTA = 5;

export const resumen = router({
  datos: entrar.query(async ({ ctx }) => {
    const { rol } = ctx.sesion;
    const verVentas = puede(rol, "ver_ventas");
    const verStock = puede(rol, "ajustar_stock");

    const desdeVentana = inicioDeHace(DIAS_VENTANA);
    const desdeVentanaPrevia = inicioDeHace(DIAS_VENTANA * 2);

    const estadosVenta = [...ESTADOS_VENTA];
    const ventana = { gte: desdeVentana };
    const ventanaPrevia = { gte: desdeVentanaPrevia, lt: desdeVentana };

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
            where: { activa: true, stock: { lte: UMBRAL_STOCK_BAJO } },
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
    ]);

    const ventas = Number(pedidosVentana?._sum.total ?? 0);
    const ventasPrevias = Number(pedidosVentanaPrevia?._sum.total ?? 0);
    const cantidadPedidos = pedidosVentana?._count ?? 0;
    const cantidadPedidosPrevios = pedidosVentanaPrevia?._count ?? 0;
    const ticket = cantidadPedidos > 0 ? ventas / cantidadPedidos : 0;
    const ticketPrevio =
      cantidadPedidosPrevios > 0 ? ventasPrevias / cantidadPedidosPrevios : 0;

    const ahora = new Date();

    return {
      dias: DIAS_VENTANA,
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
            pedidos: cantidadPedidos,
            cambioPedidos: variacion(cantidadPedidos, cantidadPedidosPrevios),
            ticket,
            cambioTicket: variacion(ticket, ticketPrevio),
            clientesNuevos,
            cambioClientesNuevos: variacion(clientesNuevos, clientesNuevosPrevios),
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
