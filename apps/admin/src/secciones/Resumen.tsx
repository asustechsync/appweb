"use client";

import { useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  codigoCorto,
  ETIQUETAS,
  ETIQUETAS_MEDIO_PAGO,
  ETIQUETAS_PAGO,
  ETIQUETAS_PERIODO,
  PERIODOS,
  TRAMOS_SERIE,
  type Periodo,
  variacion,
} from "@appweb/core";
import {
  Alerta,
  SelectorCalendario,
  SelectorSegmentado,
  Cargando,
  EstadoVacio,
  FilaGraficos,
  FilaRanking,
  FilaResumen,
  GraficoTendencia,
  PilaGraficos,
  ParejaListas,
  IconoCatalogo,
  IconoCamion,
  IconoEstrella,
  IconoLibro,
  IconoPedidos,
  ListaConPestanas,
  RejillaMetricas,
  Tarjeta,
  TarjetaActividad,
  TarjetaMetrica,
  LogoMedioPago,
  LogoBanco,
  ResumenTendencia,
  TONO_NIVEL,
} from "@appweb/ui";
import type { BancoTransferencia } from "@appweb/ui";

import { ESTADO_PAGO, ETIQUETA_PAGO_RECIENTE } from "@/lib/estados-pago";
import { LOGO_MARCA, LOGO_MEDIO } from "@/lib/logos-pago";
import { useTRPC } from "@/lib/trpc";

import { tonoDeEstado } from "./Pedidos";
import { MONEDA, conSigno, cuandoFue, diaYHora, haceCuanto, horaCorta } from "@appweb/core/formato";

const BANCOS_TRANSFERENCIA = new Set<BancoTransferencia>([
  "BCP",
  "INTERBANK",
  "BBVA",
  "SCOTIABANK",
  "BANCO_NACION",
  "OTRO",
]);

/**
 * Como se llama cada punto de la serie (el tooltip y la pildora del eje): la
 * hora en un dia, el dia y la hora en una semana y solo el dia en un mes. Los
 * puntos reparten el periodo en 24 tramos iguales; el primero es el inicio.
 */
function etiquetasDelEje(inicio: string, fin: string, puntos: number): string[] {
  const desde = new Date(inicio).getTime();
  const duracion = new Date(fin).getTime() - desde;
  const dias = duracion / 86_400_000;
  return Array.from({ length: puntos }, (_, i) => {
    const momento = new Date(desde + (i * duracion) / TRAMOS_SERIE);
    if (dias <= 1.5) return horaCorta(momento);
    const { dia } = diaYHora(momento);
    return dias <= 8 ? `${dia} ${horaCorta(momento)}` : dia;
  });
}

/**
 * Resumen del panel, en tres niveles y en ese orden:
 *
 *   1. Como va el negocio — cuatro numeros del periodo con el anterior al pie.
 *   2. Lo que necesita atencion hoy — pedidos parados y envios en camino.
 *   3. Que paso ultimamente — ultimos pedidos y ultimas altas.
 *
 * Los bloques que el rol no puede ver llegan vacios desde la API; aqui solo
 * se decide si se pintan o no.
 */
export interface PropsResumen {
  /** Lleva a la seccion Pagos; sin esto no se muestra "Ver todos". */
  onVerPagos?: () => void;
  /** Llevan a Pedidos, Inventario y Clientes; sin ellas, esa lista no ofrece "Ver todos". */
  onVerPedidos?: () => void;
  onVerInventario?: () => void;
  onVerClientes?: () => void;
  onVerEnvios?: () => void;
  onVerReclamos?: () => void;
  onVerResenas?: () => void;
}

type MetricaGrafica = "ventas" | "pedidos" | "ticket" | "clientes";

const ENTERO = (valor: number) => String(Math.round(valor));

/** Cuantas filas se ven por lista: es un resumen, no la seccion. */
const FILAS_RESUMEN = 5;
const FILAS_PAGOS_RESUMEN = 5;

function variacionVisual(actual: number, previo: number, subirEsBueno = true) {
  const porcentaje = variacion(actual, previo);
  const tono = porcentaje === 0 ? "igual" : (porcentaje > 0) === subirEsBueno ? "sube" : "baja";
  return { cambio: `${conSigno(porcentaje)}%`, tono } as const;
}

function variacionMargen(actual: number, previo: number) {
  const puntos = Math.round((actual - previo) * 10) / 10;
  const texto = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(
    Math.abs(puntos),
  );
  return {
    cambio: `${puntos < 0 ? "−" : puntos > 0 ? "+" : ""}${texto} pts`,
    tono: puntos === 0 ? "igual" : puntos > 0 ? "sube" : "baja",
  } as const;
}

function montoDescuento(valor: number): string {
  return valor > 0 ? `−${MONEDA.format(valor)}` : MONEDA.format(0);
}

export function Resumen({
  onVerPagos,
  onVerPedidos,
  onVerInventario,
  onVerClientes,
  onVerEnvios,
  onVerReclamos,
  onVerResenas,
}: PropsResumen) {
  const trpc = useTRPC();
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  // Un dia concreto del calendario; con fecha elegida manda sobre el periodo.
  const [fecha, setFecha] = useState("");
  // Que cifra dibuja la grafica grande: la que tiene el check marcado.
  const [metrica, setMetrica] = useState<MetricaGrafica>("ventas");
  // El periodo cambia solo las cifras: se conserva lo anterior mientras llegan
  // las nuevas para que el resumen no parpadee a "Cargando".
  const datos = useQuery({
    ...trpc.panel.resumen.datos.queryOptions({
      periodo,
      ...(fecha ? { fecha } : {}),
    }),
    placeholderData: keepPreviousData,
  });

  if (datos.isPending) return <Cargando texto="Cargando el resumen…" />;
  if (datos.isError) return <Alerta tono="error">{datos.error.message}</Alerta>;

  const {
    alertas,
    enviosEnCamino,
    reclamosPendientes,
    resenasPendientes,
    etiquetaAnterior,
    marcasEje,
    metricas,
    ultimosPagos,
    pagosRechazados,
    ultimosPedidos,
    ultimosUsuarios,
    rankingClientes,
    titulo,
  } = datos.data;
  const anterior = (valor: string) => ({ etiqueta: etiquetaAnterior, valor });
  const baseRentabilidad = metricas
    ? Math.max(0, metricas.margen.ganancia) +
      Math.max(0, metricas.margen.costo) +
      Math.max(0, metricas.descuentos)
    : 0;
  const parteRentabilidad = (valor: number) =>
    baseRentabilidad > 0 ? Math.round((Math.max(0, valor) / baseRentabilidad) * 100) : 0;
  // Lo que pinta la grafica segun el check: cada cifra con su serie y su formato.
  const grafica = metricas
    ? {
        ventas: {
          titulo: "Ventas",
          etiqueta: "Ventas acumuladas del periodo contra el anterior",
          serie: metricas.serieVentas,
          previa: metricas.serieVentasPrevia,
          valor: MONEDA.format(metricas.ventas),
          previo: MONEDA.format(metricas.anteriores.ventas),
          formatear: (valor: number) => MONEDA.format(valor),
        },
        pedidos: {
          titulo: "Pedidos",
          etiqueta: "Pedidos del periodo contra el anterior",
          serie: metricas.seriePedidos,
          previa: metricas.seriePedidosPrevia,
          valor: String(metricas.pedidos),
          previo: String(metricas.anteriores.pedidos),
          formatear: ENTERO,
        },
        ticket: {
          titulo: "Ticket promedio",
          etiqueta: "Ticket promedio del periodo contra el anterior",
          serie: metricas.serieTicket,
          previa: metricas.serieTicketPrevia,
          valor: MONEDA.format(metricas.ticket),
          previo: MONEDA.format(metricas.anteriores.ticket),
          formatear: (valor: number) => MONEDA.format(valor),
        },
        clientes: {
          titulo: "Clientes nuevos",
          etiqueta: "Clientes nuevos del periodo contra el anterior",
          serie: metricas.serieClientesNuevos,
          previa: metricas.serieClientesNuevosPrevia,
          valor: String(metricas.clientesNuevos),
          previo: String(metricas.anteriores.clientesNuevos),
          formatear: ENTERO,
        },
      }[metrica]
    : null;
  const parteComparativa = (actual: number, previo: number) => {
    const escala = Math.max(actual, previo);
    return escala > 0 ? Math.round((Math.max(0, actual) / escala) * 100) : 0;
  };
  const resumenGrafica = metricas
    ? metrica === "ventas"
      ? [
          {
            etiqueta: "Ganancia",
            valor: MONEDA.format(metricas.margen.ganancia),
            previo: `${etiquetaAnterior} ${MONEDA.format(metricas.margenPrevio.ganancia)}`,
            ...variacionVisual(metricas.margen.ganancia, metricas.margenPrevio.ganancia),
            parte: parteRentabilidad(metricas.margen.ganancia),
          },
          {
            etiqueta: "Margen",
            valor: `${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(metricas.margen.porcentaje)}%`,
            previo: `${etiquetaAnterior} ${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(metricas.margenPrevio.porcentaje)}%`,
            ...variacionMargen(metricas.margen.porcentaje, metricas.margenPrevio.porcentaje),
            parte: Math.max(0, Math.min(100, metricas.margen.porcentaje)),
          },
          {
            etiqueta: "Descuentos",
            valor: montoDescuento(metricas.descuentos),
            previo: `${etiquetaAnterior} ${montoDescuento(metricas.descuentosPrevios)}`,
            ...variacionVisual(metricas.descuentos, metricas.descuentosPrevios, false),
            parte: parteRentabilidad(metricas.descuentos),
          },
        ]
      : metrica === "pedidos"
        ? [
            {
              etiqueta: "Recibidos",
              valor: ENTERO(metricas.pedidosRecibidos),
              previo: `${etiquetaAnterior} ${ENTERO(metricas.pedidosRecibidosPrevios)}`,
              ...variacionVisual(metricas.pedidosRecibidos, metricas.pedidosRecibidosPrevios),
              parte: parteComparativa(metricas.pedidosRecibidos, metricas.pedidosRecibidosPrevios),
            },
            {
              etiqueta: "Pagados",
              valor: ENTERO(metricas.pedidosPagados),
              previo: `${etiquetaAnterior} ${ENTERO(metricas.pedidosPagadosPrevios)}`,
              ...variacionVisual(metricas.pedidosPagados, metricas.pedidosPagadosPrevios),
              parte:
                metricas.pedidosRecibidos > 0
                  ? Math.round((metricas.pedidosPagados / metricas.pedidosRecibidos) * 100)
                  : 0,
            },
            {
              etiqueta: "Cancelados",
              valor: ENTERO(metricas.pedidosCancelados),
              previo: `${etiquetaAnterior} ${ENTERO(metricas.pedidosCanceladosPrevios)}`,
              ...variacionVisual(metricas.pedidosCancelados, metricas.pedidosCanceladosPrevios, false),
              parte:
                metricas.pedidosRecibidos > 0
                  ? Math.round((metricas.pedidosCancelados / metricas.pedidosRecibidos) * 100)
                  : 0,
            },
          ]
        : metrica === "ticket"
          ? [
              {
                etiqueta: "Promedio",
                valor: MONEDA.format(metricas.ticket),
                previo: `${etiquetaAnterior} ${MONEDA.format(metricas.anteriores.ticket)}`,
                ...variacionVisual(metricas.ticket, metricas.anteriores.ticket),
                parte: parteComparativa(metricas.ticket, metricas.anteriores.ticket),
              },
              {
                etiqueta: "Más alto",
                valor: MONEDA.format(metricas.ticketMaximo),
                previo: `${etiquetaAnterior} ${MONEDA.format(metricas.ticketMaximoPrevio)}`,
                ...variacionVisual(metricas.ticketMaximo, metricas.ticketMaximoPrevio),
                parte: parteComparativa(metricas.ticketMaximo, metricas.ticketMaximoPrevio),
              },
              {
                etiqueta: "Más bajo",
                valor: MONEDA.format(metricas.ticketMinimo),
                previo: `${etiquetaAnterior} ${MONEDA.format(metricas.ticketMinimoPrevio)}`,
                ...variacionVisual(metricas.ticketMinimo, metricas.ticketMinimoPrevio),
                parte: parteComparativa(metricas.ticketMinimo, metricas.ticketMinimoPrevio),
              },
            ]
          : [
              {
                etiqueta: "Nuevos",
                valor: ENTERO(metricas.clientesNuevos),
                previo: `${etiquetaAnterior} ${ENTERO(metricas.anteriores.clientesNuevos)}`,
                ...variacionVisual(metricas.clientesNuevos, metricas.anteriores.clientesNuevos),
                parte: parteComparativa(metricas.clientesNuevos, metricas.anteriores.clientesNuevos),
              },
              {
                etiqueta: "Compradores",
                valor: ENTERO(metricas.clientesCompradores),
                previo: `${etiquetaAnterior} ${ENTERO(metricas.clientesCompradoresPrevios)}`,
                ...variacionVisual(metricas.clientesCompradores, metricas.clientesCompradoresPrevios),
                parte: parteComparativa(metricas.clientesCompradores, metricas.clientesCompradoresPrevios),
              },
              {
                etiqueta: "Recurrentes",
                valor: ENTERO(metricas.clientesRecurrentes),
                previo: `${etiquetaAnterior} ${ENTERO(metricas.clientesRecurrentesPrevios)}`,
                ...variacionVisual(metricas.clientesRecurrentes, metricas.clientesRecurrentesPrevios),
                parte: parteComparativa(metricas.clientesRecurrentes, metricas.clientesRecurrentesPrevios),
              },
            ]
    : [];
  const hayAlertas = alertas.pedidosPendientes.length > 0 || alertas.variantesBajas.length > 0;

  const filaPago = (pago: (typeof ultimosPagos)[number]) => (
    <TarjetaActividad
      key={pago.id}
      estado={ETIQUETA_PAGO_RECIENTE[pago.estado] ?? ETIQUETAS_PAGO[pago.estado]}
      iconoEstado={ESTADO_PAGO[pago.estado].icono}
      tonoEstado={ESTADO_PAGO[pago.estado].tono}
      fecha={cuandoFue(new Date(pago.creadoEn))}
      logo={
        pago.medio === "TRANSFERENCIA" &&
        pago.bancoTransferencia &&
        BANCOS_TRANSFERENCIA.has(pago.bancoTransferencia as BancoTransferencia) ? (
          <LogoBanco banco={pago.bancoTransferencia as BancoTransferencia} />
        ) : (
          <LogoMedioPago
            medio={pago.tarjeta ? LOGO_MARCA[pago.tarjeta.marca] : LOGO_MEDIO[pago.medio]}
            nombre={ETIQUETAS_MEDIO_PAGO[pago.medio]}
          />
        )
      }
      // Numero de orden sin el prefijo: "N.º 20261023-F52U".
      titulo={`N.º ${codigoCorto(pago.codigo)}`}
      valor={MONEDA.format(pago.monto)}
      anulado={pago.estado === "RECHAZADO"}
    />
  );
  const filasAtender = alertas.pedidosPendientes.slice(0, FILAS_RESUMEN).map((pedido) => (
    <FilaResumen
      key={pedido.id}
      marca={<IconoPedidos tamano={16} />}
      titulo={pedido.codigo}
      subtitulo={pedido.dias === 0 ? "Hoy" : `Hace ${pedido.dias} d`}
      estado={{
        texto: ETIQUETAS[pedido.estado],
        tono: tonoDeEstado(pedido.estado),
      }}
    />
  ));
  const filasEnvios = enviosEnCamino.slice(0, FILAS_RESUMEN).map((pedido) => (
    <FilaResumen
      key={pedido.id}
      marca={<IconoCamion tamano={16} />}
      titulo={pedido.codigo}
      subtitulo={pedido.transportista ?? "Sin transportista"}
      estado={{
        texto: pedido.dias === 0 ? "Hoy" : `Hace ${pedido.dias} d`,
        tono: "neutro",
      }}
    />
  ));
  const filasReclamos = reclamosPendientes.slice(0, FILAS_RESUMEN).map((hoja) => (
    <FilaResumen
      key={hoja.id}
      marca={<IconoLibro tamano={16} />}
      titulo={hoja.codigo}
      subtitulo={hoja.tipo}
      estado={{
        texto: hoja.dias === 0 ? "Hoy" : `Hace ${hoja.dias} d`,
        tono: "alerta",
      }}
    />
  ));
  const filasResenas = resenasPendientes.slice(0, FILAS_RESUMEN).map((resena) => (
    <FilaResumen
      key={resena.id}
      marca={<IconoEstrella tamano={16} />}
      titulo={resena.producto}
      subtitulo={`${resena.estrellas} de 5 estrellas`}
      estado={{
        texto: resena.dias === 0 ? "Hoy" : `Hace ${resena.dias} d`,
        tono: "alerta",
      }}
    />
  ));
  // Lo comprado de siempre, con el nivel de cada cliente y cuanto le falta para el siguiente.
  const filasRanking = (
    puestos: NonNullable<typeof rankingClientes>["porGasto"],
    por: "gasto" | "pedidos",
  ) =>
    puestos.map((puesto, indice) => {
      const cantidad = `${puesto.pedidos} ${puesto.pedidos === 1 ? "pedido" : "pedidos"}`;
      const cifra = por === "gasto" ? MONEDA.format(puesto.totalComprado) : cantidad;
      return (
        <FilaRanking
          key={puesto.usuarioId}
          puesto={indice + 1}
          nombre={puesto.nombre}
          nivel={{ nombre: puesto.nivel.nombre, tono: TONO_NIVEL[puesto.nivel.id] }}
          cifra={cifra}
          falta={puesto.faltaTexto ? `falta ${puesto.faltaTexto}` : "nivel máximo"}
          {...(onVerClientes ? { onAbrir: onVerClientes } : {})}
        />
      );
    });
  const filasCuentas = ultimosUsuarios
    .slice(0, FILAS_RESUMEN)
    .map((usuario) => (
      <FilaResumen
        key={usuario.id}
        marca={usuario.nombre.charAt(0).toUpperCase()}
        titulo={usuario.nombre}
        subtitulo={cuandoFue(new Date(usuario.creadoEn))}
      />
    ));
  const filasStock = alertas.variantesBajas.slice(0, FILAS_RESUMEN).map((variante) => (
    <FilaResumen
      key={variante.id}
      marca={<IconoCatalogo tamano={16} />}
      titulo={variante.nombre}
      subtitulo={`Talla ${variante.talla} · ${variante.color}`}
      estado={{
        texto: variante.stock === 0 ? "Agotado" : `${variante.stock} und.`,
        tono: variante.stock === 0 ? "error" : "alerta",
      }}
    />
  ));

  return (
    <>
      {metricas && grafica ? (
        <Tarjeta sinMarco>
          <RejillaMetricas>
            <TarjetaMetrica
              etiqueta="Ventas"
              seleccionada={metrica === "ventas"}
              onSeleccionar={() => setMetrica("ventas")}
              valor={MONEDA.format(metricas.ventas)}
              cambio={metricas.cambioVentas}
              serie={metricas.serieVentas}
              seriePrevia={metricas.serieVentasPrevia}
              diferencia={conSigno(metricas.diferenciaVentas, MONEDA)}
              anterior={anterior(MONEDA.format(metricas.anteriores.ventas))}
            />
            <TarjetaMetrica
              etiqueta="Pedidos"
              seleccionada={metrica === "pedidos"}
              onSeleccionar={() => setMetrica("pedidos")}
              valor={String(metricas.pedidos)}
              cambio={metricas.cambioPedidos}
              serie={metricas.seriePedidos}
              seriePrevia={metricas.seriePedidosPrevia}
              diferencia={conSigno(metricas.diferenciaPedidos)}
              anterior={anterior(String(metricas.anteriores.pedidos))}
            />
            <TarjetaMetrica
              etiqueta="Ticket promedio"
              seleccionada={metrica === "ticket"}
              onSeleccionar={() => setMetrica("ticket")}
              valor={MONEDA.format(metricas.ticket)}
              cambio={metricas.cambioTicket}
              serie={metricas.serieTicket}
              seriePrevia={metricas.serieTicketPrevia}
              diferencia={conSigno(metricas.diferenciaTicket, MONEDA)}
              anterior={anterior(MONEDA.format(metricas.anteriores.ticket))}
            />
            <TarjetaMetrica
              etiqueta="Clientes nuevos"
              seleccionada={metrica === "clientes"}
              onSeleccionar={() => setMetrica("clientes")}
              valor={String(metricas.clientesNuevos)}
              cambio={metricas.cambioClientesNuevos}
              serie={metricas.serieClientesNuevos}
              seriePrevia={metricas.serieClientesNuevosPrevia}
              diferencia={conSigno(metricas.diferenciaClientesNuevos)}
              anterior={anterior(String(metricas.anteriores.clientesNuevos))}
            />
          </RejillaMetricas>
          <FilaGraficos>
            <PilaGraficos>
              <GraficoTendencia
                serie={grafica.serie}
                seriePrevia={grafica.previa}
                titulo={grafica.titulo}
                controles={
                  <>
                    <SelectorCalendario
                      id="fecha-metricas"
                      etiqueta="Elegir un día"
                      etiquetaOculta
                      placeholder="Elegir día"
                      valor={fecha}
                      onCambio={setFecha}
                      limpiable
                      alineacion="fin"
                    />
                    <SelectorSegmentado
                      etiqueta="Periodo de las métricas"
                      // Con un dia del calendario elegido, ningun periodo esta activo.
                      valor={fecha ? "" : periodo}
                      opciones={PERIODOS.map((id) => ({
                        valor: id,
                        etiqueta: ETIQUETAS_PERIODO[id],
                      }))}
                      onCambio={(valor) => {
                        setFecha("");
                        setPeriodo(valor as Periodo);
                      }}
                    />
                  </>
                }
                etiquetaActual={titulo}
                valor={grafica.valor}
                // La cabecera nombra las series; el detalle del periodo va abajo.
                cifras={[]}
                // Se reserva siempre la linea de nota para que el area del
                // grafico no cambie de posicion al alternar metricas.
                nota={
                  metrica === "ventas" && metricas.ultimaVenta
                    ? haceCuanto(new Date(metricas.ultimaVenta))
                    : "\u00a0"
                }
                valorPrevio={grafica.previo}
                etiquetaPrevia={etiquetaAnterior}
                marcas={marcasEje}
                etiqueta={grafica.etiqueta}
                etiquetasPunto={etiquetasDelEje(
                  datos.data.inicioPeriodo,
                  datos.data.finPeriodo,
                  grafica.serie.length,
                )}
                formatear={grafica.formatear}
              />
            </PilaGraficos>
            <ResumenTendencia datos={resumenGrafica} />
            <ListaConPestanas
              etiqueta="Pagos"
              reservar={FILAS_PAGOS_RESUMEN}
              pestanas={[
                {
                  valor: "recientes",
                  etiqueta: "Recientes",
                  titulo: "Pagos recientes",
                  vacio: "Todavía no hay pagos registrados.",
                  ...(onVerPagos ? { onVerTodos: onVerPagos } : {}),
                  filas: ultimosPagos.map(filaPago),
                },
                {
                  valor: "rechazados",
                  etiqueta: "Rechazados",
                  titulo: "Pagos rechazados",
                  vacio: "No hay pagos rechazados.",
                  ...(onVerPagos ? { onVerTodos: onVerPagos } : {}),
                  filas: pagosRechazados.map(filaPago),
                },
              ]}
            />
          </FilaGraficos>
        </Tarjeta>
      ) : null}

      <ParejaListas>
        <ListaConPestanas
          etiqueta="Pedidos y envíos"
          reservar={FILAS_RESUMEN}
          pestanas={[
            ...(metricas
              ? [
                  {
                    valor: "atender",
                    etiqueta: "Pedidos",
                    titulo: "Pedidos por atender",
                    vacio: "No hay pedidos por atender.",
                    ...(onVerPedidos ? { onVerTodos: onVerPedidos } : {}),
                    filas: filasAtender,
                  },
                ]
              : []),
            ...(metricas
              ? [
                  {
                    valor: "envios",
                    etiqueta: "Envíos",
                    titulo: "Envíos en camino",
                    vacio: "No hay envíos en camino.",
                    ...(onVerEnvios ? { onVerTodos: onVerEnvios } : {}),
                    filas: filasEnvios,
                  },
                ]
              : []),
          ]}
        />
        <ListaConPestanas
          etiqueta="Registros y reclamos"
          reservar={FILAS_RESUMEN}
          pestanas={[
            {
              valor: "cuentas",
              etiqueta: "Registros",
              titulo: "Registros nuevos",
              vacio: "Todavía no hay registros.",
              ...(onVerClientes ? { onVerTodos: onVerClientes } : {}),
              filas: filasCuentas,
            },
            {
              valor: "reclamos",
              etiqueta: "Reclamos",
              titulo: "Reclamos sin responder",
              vacio: "No hay reclamos pendientes.",
              ...(onVerReclamos ? { onVerTodos: onVerReclamos } : {}),
              filas: filasReclamos,
            },
          ]}
        />
        {rankingClientes ? (
          <ListaConPestanas
            etiqueta="Ranking de clientes"
            reservar={FILAS_RESUMEN}
            pestanas={[
              {
                valor: "gasto",
                etiqueta: "Gasto",
                titulo: "Clientes que más compraron",
                vacio: "Todavía no hay compras.",
                ...(onVerClientes ? { onVerTodos: onVerClientes } : {}),
                filas: filasRanking(rankingClientes.porGasto, "gasto"),
              },
              {
                valor: "pedidos",
                etiqueta: "Pedidos",
                titulo: "Clientes con más pedidos",
                vacio: "Todavía no hay compras.",
                ...(onVerClientes ? { onVerTodos: onVerClientes } : {}),
                filas: filasRanking(rankingClientes.porPedidos, "pedidos"),
              },
            ]}
          />
        ) : null}
      </ParejaListas>

      {!hayAlertas && metricas === null && ultimosPedidos.length === 0 ? (
        <EstadoVacio
          titulo="Nada que mostrar todavía"
          texto="Cuando entren pedidos y se mueva el stock, el resumen se llena solo."
        />
      ) : null}
    </>
  );
}
