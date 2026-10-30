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
  codigoReclamo,
  diasDesde,
  ETIQUETAS_TIPO_RECLAMO,
  ESTADOS_PENDIENTES,
  ESTADOS_VENTA,
  marcaDeTarjeta,
  marcasDelEje,
  factorDeDescuento,
  margenDeVentas,
  MEDIOS_DE_COBRO,
  puede,
  repartoPorMedio,
  seriesDelResumen,
  UMBRAL_STOCK_BAJO,
  variacion,
  vendidoDe,
  ventanaDe,
  ventanaDeFecha,
  type EstadoPago,
  type EstadoPedido,
  type TipoReclamo,
  type MedioPagoPedido,
} from "@appweb/core";
import { esquemaResumen } from "@appweb/core/tipos";

import { rankingDeClientes } from "../../clientes";
import { exige, router } from "../../trpc";

const entrar = exige("entrar_panel");

/** Cuantas filas trae cada lista del resumen: es un vistazo, no un listado. */
const TOPE_LISTA = 5;
/** Cuantos clientes entran en el ranking del inicio. */
const FILAS_RANKING = 5;

/** Lo que el margen necesita de cada linea vendida y de su pedido. */
const SELECCION_LINEA_VENDIDA = {
  precioUnitario: true,
  costoUnitario: true,
  cantidad: true,
  pedido: { select: { subtotal: true, descuento: true } },
} as const;

/**
 * Margen de unas lineas vendidas, cada una con el descuento de su pedido
 * repartido: un cupon del 10 % deja cada precio en el 90 %.
 */
function margenDeLineas(
  lineas: {
    precioUnitario: unknown;
    costoUnitario: unknown;
    cantidad: number;
    pedido: { subtotal: unknown; descuento: unknown };
  }[],
) {
  return margenDeVentas(
    lineas.map((linea) => ({
      precioUnitario:
        Number(linea.precioUnitario) *
        factorDeDescuento(Number(linea.pedido.subtotal), Number(linea.pedido.descuento)),
      costoUnitario: linea.costoUnitario === null ? null : Number(linea.costoUnitario),
      cantidad: linea.cantidad,
    })),
  );
}

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
      ultimosPagos,
      pagosRechazados,
      pagosPorMedio,
      enviosEnCamino,
      reclamosPendientes,
      resenasPendientes,
      lineasVendidas,
      lineasVendidasPrevias,
      rankingClientes,
      pedidosPorEstado,
      pedidosPorEstadoPrevios,
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
            _sum: { subtotal: true, descuento: true },
            _count: true,
          })
        : null,
      verVentas
        ? ctx.prisma.pedido.aggregate({
            where: { estado: { in: estadosVenta }, creadoEn: ventanaPrevia },
            _sum: { subtotal: true, descuento: true },
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
            select: { id: true, nombre: true, creadoEn: true },
          })
        : [],
      // Para los minigraficos: cada venta y cada alta del periodo con su hora.
      verVentas
        ? ctx.prisma.pedido.findMany({
            where: { estado: { in: estadosVenta }, creadoEn: ventana },
            select: { creadoEn: true, subtotal: true, descuento: true, usuarioId: true },
          })
        : [],
      verVentas
        ? ctx.prisma.usuario.findMany({ where: { creadoEn: ventana }, select: { creadoEn: true } })
        : [],
      // Y las del periodo anterior entero, para la linea punteada.
      verVentas
        ? ctx.prisma.pedido.findMany({
            where: { estado: { in: estadosVenta }, creadoEn: ventanaPrevia },
            select: { creadoEn: true, subtotal: true, descuento: true, usuarioId: true },
          })
        : [],
      verVentas
        ? ctx.prisma.usuario.findMany({
            where: { creadoEn: ventanaPrevia },
            select: { creadoEn: true },
          })
        : [],
      // Los ultimos cobros con su medio: por donde esta entrando la plata y
      // que falta confirmar. No depende del periodo: es lo mas reciente.
      verVentas
        ? ctx.prisma.pago.findMany({
            orderBy: { creadoEn: "desc" },
            take: TOPE_LISTA,
            select: {
              id: true,
              medio: true,
              monto: true,
              estado: true,
              creadoEn: true,
              tarjetaMarca: true,
              tarjetaUltimos: true,
              pedido: { select: { codigo: true, bancoTransferencia: true } },
            },
          })
        : [],
      // Cobros rechazados: para contactar al cliente y recuperar la venta.
      verVentas
        ? ctx.prisma.pago.findMany({
            where: { estado: "RECHAZADO" },
            orderBy: { creadoEn: "desc" },
            take: TOPE_LISTA,
            select: {
              id: true,
              medio: true,
              monto: true,
              estado: true,
              creadoEn: true,
              tarjetaMarca: true,
              tarjetaUltimos: true,
              pedido: { select: { codigo: true, bancoTransferencia: true } },
            },
          })
        : [],
      // Por que medio entro la plata del periodo: solo pagos confirmados, lo
      // pendiente o rechazado todavia no es plata.
      verVentas
        ? ctx.prisma.pago.groupBy({
            by: ["medio"],
            where: { estado: "CONFIRMADO", creadoEn: ventana },
            _sum: { monto: true },
            _count: { _all: true },
          })
        : [],
      // Despachados que aun no llegan: los mas viejos primero.
      verVentas
        ? ctx.prisma.pedido.findMany({
            where: { estado: "ENVIADO" },
            orderBy: { enviadoEn: "asc" },
            take: TOPE_LISTA,
            select: { id: true, codigo: true, transportista: true, enviadoEn: true },
          })
        : [],
      // Hojas del Libro de Reclamaciones sin respuesta, las mas viejas primero.
      puede(rol, "atender_reclamos")
        ? ctx.prisma.reclamo.findMany({
            where: { estado: "PENDIENTE" },
            orderBy: { creadoEn: "asc" },
            take: TOPE_LISTA,
            select: { id: true, numero: true, tipo: true, creadoEn: true },
          })
        : [],
      // Reseñas por moderar, las mas viejas primero.
      puede(rol, "moderar_resenas")
        ? ctx.prisma.resena.findMany({
            where: { estado: "PENDIENTE" },
            orderBy: { creadoEn: "asc" },
            take: TOPE_LISTA,
            select: {
              id: true,
              estrellas: true,
              creadoEn: true,
              producto: { select: { nombre: true } },
            },
          })
        : [],
      // Lo vendido en el periodo y en el anterior, con precio y costo
      // congelados: el margen y su comparacion.
      verVentas
        ? ctx.prisma.itemPedido.findMany({
            where: { pedido: { estado: { in: estadosVenta }, creadoEn: ventana } },
            select: SELECCION_LINEA_VENDIDA,
          })
        : [],
      verVentas
        ? ctx.prisma.itemPedido.findMany({
            where: { pedido: { estado: { in: estadosVenta }, creadoEn: ventanaPrevia } },
            select: SELECCION_LINEA_VENDIDA,
          })
        : [],
      // Los que mas compraron, de siempre: no depende del periodo elegido.
      verVentas ? rankingDeClientes(ctx.prisma, FILAS_RANKING) : null,
      verVentas
        ? ctx.prisma.pedido.groupBy({
            by: ["estado"],
            where: { creadoEn: ventana },
            _count: { _all: true },
          })
        : [],
      verVentas
        ? ctx.prisma.pedido.groupBy({
            by: ["estado"],
            where: { creadoEn: ventanaPrevia },
            _count: { _all: true },
          })
        : [],
    ]);

    // Ventas = productos menos descuentos, sin el envio.
    const ventas = pedidosVentana ? vendidoDe(pedidosVentana._sum) : 0;
    const ventasPrevias = pedidosVentanaPrevia ? vendidoDe(pedidosVentanaPrevia._sum) : 0;
    const cantidadPedidos = pedidosVentana?._count ?? 0;
    const cantidadPedidosPrevios = pedidosVentanaPrevia?._count ?? 0;
    const ticket = cantidadPedidos > 0 ? ventas / cantidadPedidos : 0;
    const ticketPrevio = cantidadPedidosPrevios > 0 ? ventasPrevias / cantidadPedidosPrevios : 0;
    const contarEstado = (estados: typeof pedidosPorEstado, estado: string) =>
      estados.find((fila) => fila.estado === estado)?._count._all ?? 0;
    const pedidosRecibidos = pedidosPorEstado.reduce((total, fila) => total + fila._count._all, 0);
    const pedidosRecibidosPrevios = pedidosPorEstadoPrevios.reduce(
      (total, fila) => total + fila._count._all,
      0,
    );
    const pedidosPagados = estadosVenta.reduce(
      (total, estado) => total + contarEstado(pedidosPorEstado, estado),
      0,
    );
    const pedidosPagadosPrevios = estadosVenta.reduce(
      (total, estado) => total + contarEstado(pedidosPorEstadoPrevios, estado),
      0,
    );
    const pedidosCancelados = contarEstado(pedidosPorEstado, "CANCELADO");
    const pedidosCanceladosPrevios = contarEstado(pedidosPorEstadoPrevios, "CANCELADO");
    const extremosTicket = (pedidos: typeof pedidosSerie) =>
      pedidos.reduce(
        (extremos, pedido) => {
          const monto = vendidoDe(pedido);
          return {
            minimo: Math.min(extremos.minimo, monto),
            maximo: Math.max(extremos.maximo, monto),
          };
        },
        { minimo: Number.POSITIVE_INFINITY, maximo: 0 },
      );
    const extremosTicketActual = extremosTicket(pedidosSerie);
    const extremosTicketPrevios = extremosTicket(pedidosSeriePrevia);
    const ticketMinimo = Number.isFinite(extremosTicketActual.minimo)
      ? extremosTicketActual.minimo
      : 0;
    const ticketMinimoPrevio = Number.isFinite(extremosTicketPrevios.minimo)
      ? extremosTicketPrevios.minimo
      : 0;
    const compradores = [...new Set(pedidosSerie.map((pedido) => pedido.usuarioId))];
    const compradoresPrevios = [...new Set(pedidosSeriePrevia.map((pedido) => pedido.usuarioId))];
    const [compradoresRecurrentes, compradoresRecurrentesPrevios] = await Promise.all([
      compradores.length > 0
        ? ctx.prisma.pedido.groupBy({
            by: ["usuarioId"],
            where: {
              usuarioId: { in: compradores },
              estado: { in: estadosVenta },
              creadoEn: { lt: periodo.desde },
            },
          })
        : [],
      compradoresPrevios.length > 0
        ? ctx.prisma.pedido.groupBy({
            by: ["usuarioId"],
            where: {
              usuarioId: { in: compradoresPrevios },
              estado: { in: estadosVenta },
              creadoEn: { lt: periodo.previoDesde },
            },
          })
        : [],
    ]);

    // Las dos lineas comparten el eje del periodo entero: la actual se corta
    // en ahora y la anterior llega completa, asi se ve cuanto falta.
    const series = seriesDelResumen(
      pedidosSerie.map((p) => ({ en: p.creadoEn, total: vendidoDe(p) })),
      altasSerie.map((u) => u.creadoEn),
      periodo.desde,
      periodo.fin,
      ahora,
    );
    const seriesPrevias = seriesDelResumen(
      pedidosSeriePrevia.map((p) => ({ en: p.creadoEn, total: vendidoDe(p) })),
      altasSeriePrevia.map((u) => u.creadoEn),
      periodo.previoDesde,
      periodo.previoHasta,
    );

    return {
      titulo: periodo.titulo,
      contexto: periodo.contexto,
      etiquetaAnterior: periodo.etiquetaPrevio,
      marcasEje: marcasDelEje(periodo.desde, periodo.fin),
      // Donde empieza y termina el eje: con ellos la pantalla nombra cada punto de la serie.
      inicioPeriodo: periodo.desde.toISOString(),
      finPeriodo: periodo.fin.toISOString(),
      // Todos los medios con los que se cobra, tambien los que no recibieron
      // nada en el periodo.
      mediosDePago: repartoPorMedio(
        MEDIOS_DE_COBRO.map((medio) => {
          const grupo = pagosPorMedio.find((g) => g.medio === medio);
          return {
            medio,
            monto: Number(grupo?._sum.monto ?? 0),
            pagos: grupo?._count._all ?? 0,
          };
        }),
      ),
      ultimosPagos: ultimosPagos.map((pago) => ({
        id: pago.id,
        medio: pago.medio as MedioPagoPedido,
        estado: pago.estado as EstadoPago,
        monto: Number(pago.monto),
        creadoEn: pago.creadoEn.toISOString(),
        codigo: pago.pedido.codigo,
        bancoTransferencia: pago.pedido.bancoTransferencia,
        // Solo con tarjeta: la marca reconocida y los ultimos 4 digitos.
        tarjeta:
          pago.medio === "TARJETA"
            ? { marca: marcaDeTarjeta(pago.tarjetaMarca), ultimos: pago.tarjetaUltimos }
            : null,
      })),
      pagosRechazados: pagosRechazados.map((pago) => ({
        id: pago.id,
        medio: pago.medio as MedioPagoPedido,
        estado: pago.estado as EstadoPago,
        monto: Number(pago.monto),
        creadoEn: pago.creadoEn.toISOString(),
        codigo: pago.pedido.codigo,
        bancoTransferencia: pago.pedido.bancoTransferencia,
        // Solo con tarjeta: la marca reconocida y los ultimos 4 digitos.
        tarjeta:
          pago.medio === "TARJETA"
            ? { marca: marcaDeTarjeta(pago.tarjetaMarca), ultimos: pago.tarjetaUltimos }
            : null,
      })),
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
      enviosEnCamino: enviosEnCamino.map((pedido) => ({
        id: pedido.id,
        codigo: pedido.codigo,
        transportista: pedido.transportista,
        dias: diasDesde(pedido.enviadoEn ?? ahora, ahora),
      })),
      reclamosPendientes: reclamosPendientes.map((hoja) => ({
        id: hoja.id,
        codigo: codigoReclamo(hoja.numero, hoja.creadoEn),
        tipo: ETIQUETAS_TIPO_RECLAMO[hoja.tipo as TipoReclamo],
        dias: diasDesde(hoja.creadoEn, ahora),
      })),
      resenasPendientes: resenasPendientes.map((resena) => ({
        id: resena.id,
        producto: resena.producto.nombre,
        estrellas: resena.estrellas,
        dias: diasDesde(resena.creadoEn, ahora),
      })),
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
            pedidosRecibidos,
            pedidosRecibidosPrevios,
            pedidosPagados,
            pedidosPagadosPrevios,
            pedidosCancelados,
            pedidosCanceladosPrevios,
            ticketMaximo: extremosTicketActual.maximo,
            ticketMaximoPrevio: extremosTicketPrevios.maximo,
            ticketMinimo,
            ticketMinimoPrevio,
            clientesCompradores: compradores.length,
            clientesCompradoresPrevios: compradoresPrevios.length,
            clientesRecurrentes: compradoresRecurrentes.length,
            clientesRecurrentesPrevios: compradoresRecurrentesPrevios.length,
            // Lo que se dejo de cobrar por cupones y niveles en el periodo.
            descuentos: Number(pedidosVentana?._sum.descuento ?? 0),
            margen: margenDeLineas(lineasVendidas),
            // La del periodo anterior entero: para el "vs ayer" de cada tarjeta.
            margenPrevio: margenDeLineas(lineasVendidasPrevias),
            descuentosPrevios: Number(pedidosVentanaPrevia?._sum.descuento ?? 0),
            ultimaVenta:
              pedidosSerie.length > 0
                ? new Date(Math.max(...pedidosSerie.map((p) => p.creadoEn.getTime()))).toISOString()
                : null,
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
      rankingClientes,
      ultimosUsuarios: ultimosUsuarios.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        creadoEn: usuario.creadoEn.toISOString(),
      })),
    };
  }),
});
