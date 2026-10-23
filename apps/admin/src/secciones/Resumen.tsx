"use client";

import { useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  ETIQUETAS,
  ETIQUETAS_PERIODO,
  PERIODOS,
  type EstadoPedido,
  type Periodo,
} from "@appweb/core";
import {
  Alerta,
  SelectorCalendario,
  SelectorSegmentado,
  Cargando,
  EstadoVacio,
  FilaLista,
  Insignia,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";
import { FECHA, MONEDA, conSigno } from "@appweb/core/formato";

/** Ambar mientras espera algo, verde cuando ya avanzo. */
function tonoDeEstado(estado: EstadoPedido): "exito" | "alerta" | "neutro" {
  if (estado === "ENTREGADO" || estado === "PAGADO") return "exito";
  if (estado === "PENDIENTE_PAGO") return "alerta";
  return "neutro";
}

/**
 * Resumen del panel, en tres niveles y en ese orden:
 *
 *   1. Como va el negocio — cuatro numeros del periodo con el anterior al pie.
 *   2. Lo que necesita atencion hoy — pedidos parados y stock por acabarse.
 *   3. Que paso ultimamente — ultimos pedidos y ultimas altas.
 *
 * Los bloques que el rol no puede ver llegan vacios desde la API; aqui solo
 * se decide si se pintan o no.
 */
export function Resumen() {
  const trpc = useTRPC();
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  // Un dia concreto del calendario; con fecha elegida manda sobre el periodo.
  const [fecha, setFecha] = useState("");
  // El periodo cambia solo las cifras: se conserva lo anterior mientras llegan
  // las nuevas para que el resumen no parpadee a "Cargando".
  const datos = useQuery({
    ...trpc.panel.resumen.datos.queryOptions({ periodo, ...(fecha ? { fecha } : {}) }),
    placeholderData: keepPreviousData,
  });

  if (datos.isPending) return <Cargando texto="Cargando el resumen…" />;
  if (datos.isError) return <Alerta tono="error">{datos.error.message}</Alerta>;

  const { alertas, etiquetaAnterior, metricas, ultimosPedidos, ultimosUsuarios, titulo } =
    datos.data;
  const anterior = (valor: string) => ({ etiqueta: etiquetaAnterior, valor });
  const hayAlertas = alertas.pedidosPendientes.length > 0 || alertas.variantesBajas.length > 0;

  return (
    <>
      {metricas ? (
        <Tarjeta
          titulo={titulo}
          sinMarco
          acciones={
            <>
              <SelectorSegmentado
                etiqueta="Periodo de las métricas"
                // Con un dia del calendario elegido, ningun periodo esta activo.
                valor={fecha ? "" : periodo}
                opciones={PERIODOS.map((id) => ({ valor: id, etiqueta: ETIQUETAS_PERIODO[id] }))}
                onCambio={(valor) => {
                  setFecha("");
                  setPeriodo(valor as Periodo);
                }}
              />
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
            </>
          }
        >
          <RejillaMetricas>
            <TarjetaMetrica
              etiqueta="Ventas"
              valor={MONEDA.format(metricas.ventas)}
              cambio={metricas.cambioVentas}
              serie={metricas.serieVentas}
              seriePrevia={metricas.serieVentasPrevia}
              diferencia={conSigno(metricas.diferenciaVentas, MONEDA)}
              anterior={anterior(MONEDA.format(metricas.anteriores.ventas))}
            />
            <TarjetaMetrica
              etiqueta="Pedidos"
              valor={String(metricas.pedidos)}
              cambio={metricas.cambioPedidos}
              serie={metricas.seriePedidos}
              seriePrevia={metricas.seriePedidosPrevia}
              diferencia={conSigno(metricas.diferenciaPedidos)}
              anterior={anterior(String(metricas.anteriores.pedidos))}
            />
            <TarjetaMetrica
              etiqueta="Ticket promedio"
              valor={MONEDA.format(metricas.ticket)}
              cambio={metricas.cambioTicket}
              serie={metricas.serieTicket}
              seriePrevia={metricas.serieTicketPrevia}
              diferencia={conSigno(metricas.diferenciaTicket, MONEDA)}
              anterior={anterior(MONEDA.format(metricas.anteriores.ticket))}
            />
            <TarjetaMetrica
              etiqueta="Clientes nuevos"
              valor={String(metricas.clientesNuevos)}
              cambio={metricas.cambioClientesNuevos}
              serie={metricas.serieClientesNuevos}
              seriePrevia={metricas.serieClientesNuevosPrevia}
              diferencia={conSigno(metricas.diferenciaClientesNuevos)}
              anterior={anterior(String(metricas.anteriores.clientesNuevos))}
            />
          </RejillaMetricas>
        </Tarjeta>
      ) : null}

      {hayAlertas ? (
        <>
          {alertas.pedidosPendientes.length > 0 ? (
            <Tarjeta titulo="Pedidos por atender">
              {alertas.pedidosPendientes.map((pedido) => (
                <FilaLista
                  key={pedido.id}
                  acciones={
                    <Insignia tono={pedido.dias >= 2 ? "alerta" : "neutro"}>
                      {pedido.dias === 0 ? "Hoy" : `Hace ${pedido.dias} d`}
                    </Insignia>
                  }
                >
                  <strong>{pedido.codigo}</strong>
                  <span>{MONEDA.format(pedido.total)}</span>
                  <span>
                    <Insignia tono={tonoDeEstado(pedido.estado)}>
                      {ETIQUETAS[pedido.estado]}
                    </Insignia>
                  </span>
                </FilaLista>
              ))}
            </Tarjeta>
          ) : null}

          {alertas.variantesBajas.length > 0 ? (
            <Tarjeta titulo="Stock por acabarse">
              {alertas.variantesBajas.map((variante) => (
                <FilaLista
                  key={variante.id}
                  acciones={
                    <Insignia tono={variante.stock === 0 ? "error" : "alerta"}>
                      {variante.stock === 0 ? "Agotado" : `${variante.stock} und.`}
                    </Insignia>
                  }
                >
                  <strong>{variante.nombre}</strong>
                  <span>
                    Talla {variante.talla} · {variante.color}
                  </span>
                </FilaLista>
              ))}
            </Tarjeta>
          ) : null}
        </>
      ) : null}

      {ultimosPedidos.length > 0 ? (
        <Tarjeta titulo="Últimos pedidos">
          {ultimosPedidos.map((pedido) => (
            <FilaLista
              key={pedido.id}
              acciones={
                <Insignia tono={tonoDeEstado(pedido.estado)}>{ETIQUETAS[pedido.estado]}</Insignia>
              }
            >
              <strong>{pedido.codigo}</strong>
              <span>
                {FECHA.format(new Date(pedido.creadoEn))} · {MONEDA.format(pedido.total)}
              </span>
            </FilaLista>
          ))}
        </Tarjeta>
      ) : null}

      {ultimosUsuarios.length > 0 ? (
        <Tarjeta titulo="Últimas cuentas creadas">
          {ultimosUsuarios.map((usuario) => (
            <FilaLista key={usuario.id}>
              <strong>{usuario.nombre}</strong>
              <span>{usuario.email}</span>
            </FilaLista>
          ))}
        </Tarjeta>
      ) : null}

      {!hayAlertas && metricas === null && ultimosPedidos.length === 0 ? (
        <EstadoVacio
          titulo="Nada que mostrar todavía"
          texto="Cuando entren pedidos y se mueva el stock, el resumen se llena solo."
        />
      ) : null}
    </>
  );
}
