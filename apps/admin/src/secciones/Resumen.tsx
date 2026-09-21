"use client";

import { useQuery } from "@tanstack/react-query";

import { ETIQUETAS, type EstadoPedido } from "@appweb/core";
import {
  Alerta,
  Cargando,
  EstadoVacio,
  FilaLista,
  Insignia,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

const MONEDA = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const FECHA = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });

/** Ambar mientras espera algo, verde cuando ya avanzo. */
function tonoDeEstado(estado: EstadoPedido): "exito" | "alerta" | "neutro" {
  if (estado === "ENTREGADO" || estado === "PAGADO") return "exito";
  if (estado === "PENDIENTE_PAGO") return "alerta";
  return "neutro";
}

/**
 * Resumen del panel, en tres niveles y en ese orden:
 *
 *   1. Lo que necesita atencion hoy — pedidos parados y stock por acabarse.
 *   2. Como va el negocio — cuatro numeros contra la semana anterior.
 *   3. Que paso ultimamente — ultimos pedidos y ultimas altas.
 *
 * Los bloques que el rol no puede ver llegan vacios desde la API; aqui solo
 * se decide si se pintan o no.
 */
export function Resumen() {
  const trpc = useTRPC();
  const datos = useQuery(trpc.panel.resumen.datos.queryOptions());

  if (datos.isPending) return <Cargando texto="Cargando el resumen…" />;
  if (datos.isError) return <Alerta tono="error">{datos.error.message}</Alerta>;

  const { alertas, metricas, ultimosPedidos, ultimosUsuarios, dias } = datos.data;
  const contexto = `vs. ${dias} días previos`;
  const hayAlertas =
    alertas.pedidosPendientes.length > 0 || alertas.variantesBajas.length > 0;

  return (
    <>
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

      {metricas ? (
        <Tarjeta titulo={`Últimos ${dias} días`}>
          <RejillaMetricas>
            <TarjetaMetrica
              etiqueta="Ventas"
              valor={MONEDA.format(metricas.ventas)}
              cambio={metricas.cambioVentas}
              contexto={contexto}
            />
            <TarjetaMetrica
              etiqueta="Pedidos"
              valor={String(metricas.pedidos)}
              cambio={metricas.cambioPedidos}
              contexto={contexto}
            />
            <TarjetaMetrica
              etiqueta="Ticket promedio"
              valor={MONEDA.format(metricas.ticket)}
              cambio={metricas.cambioTicket}
              contexto={contexto}
            />
            <TarjetaMetrica
              etiqueta="Clientes nuevos"
              valor={String(metricas.clientesNuevos)}
              cambio={metricas.cambioClientesNuevos}
              contexto={contexto}
            />
          </RejillaMetricas>
        </Tarjeta>
      ) : null}

      {ultimosPedidos.length > 0 ? (
        <Tarjeta titulo="Últimos pedidos">
          {ultimosPedidos.map((pedido) => (
            <FilaLista
              key={pedido.id}
              acciones={
                <Insignia tono={tonoDeEstado(pedido.estado)}>
                  {ETIQUETAS[pedido.estado]}
                </Insignia>
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
