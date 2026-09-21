"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { ETIQUETAS, type EstadoPedido } from "@appweb/core";
import {
  Alerta,
  Boton,
  Cargando,
  EstadoVacio,
  FilaLista,
  Insignia,
  Tarjeta,
  TarjetaPedido,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

const FECHA = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });
const MONEDA = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

/** Verde cuando el pedido avanza bien, ambar mientras espera algo del cliente. */
function tonoDeEstado(estado: string): "exito" | "alerta" | "neutro" {
  if (estado === "ENTREGADO" || estado === "PAGADO") return "exito";
  if (estado === "PENDIENTE_PAGO") return "alerta";
  return "neutro";
}

export function Pedidos() {
  const trpc = useTRPC();
  const [abierto, setAbierto] = useState<string | null>(null);

  const lista = useQuery(trpc.cuenta.pedidos.queryOptions());

  const detalle = useQuery({
    ...trpc.cuenta.pedido.queryOptions({ codigo: abierto ?? "" }),
    enabled: abierto !== null,
  });

  if (lista.isPending) return <Cargando texto="Cargando tus pedidos…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  if (lista.data.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no tienes pedidos"
        texto="Cuando compres algo lo verás aquí, con su estado y su detalle."
        textoAccion="Ver productos"
        hrefAccion="/"
      />
    );
  }

  return (
    <>
      <Tarjeta titulo="Mis pedidos">
        {lista.data.map((pedido) => (
          <FilaLista
            key={pedido.codigo}
            acciones={
              <Boton
                variante="secundario"
                onClick={() => setAbierto(abierto === pedido.codigo ? null : pedido.codigo)}
              >
                {abierto === pedido.codigo ? "Ocultar" : "Ver detalle"}
              </Boton>
            }
          >
            <strong>{pedido.codigo}</strong>
            <span>
              {FECHA.format(new Date(pedido.creadoEn))} · {pedido.lineas}{" "}
              {pedido.lineas === 1 ? "producto" : "productos"} · {MONEDA.format(pedido.total)}
            </span>
            <span>
              <Insignia tono={tonoDeEstado(pedido.estado)}>
                {ETIQUETAS[pedido.estado as EstadoPedido]}
              </Insignia>
            </span>
          </FilaLista>
        ))}
      </Tarjeta>

      {abierto !== null ? (
        <Tarjeta titulo={`Detalle de ${abierto}`}>
          {detalle.isPending ? (
            <Cargando texto="Cargando el pedido…" />
          ) : detalle.isError ? (
            <Alerta tono="error">{detalle.error.message}</Alerta>
          ) : (
            <>
              <TarjetaPedido
                items={detalle.data.items}
                subtotal={detalle.data.subtotal}
                descuento={detalle.data.descuento}
                costoEnvio={detalle.data.costoEnvio}
                total={detalle.data.total}
              />
              <p>
                {detalle.data.envioCalle} — {detalle.data.envioDistrito},{" "}
                {detalle.data.envioProvincia}, {detalle.data.envioDepartamento}
              </p>
              <p>
                {detalle.data.envioMetodo} ·{" "}
                {detalle.data.comprobante === "FACTURA" ? "Factura" : "Boleta"}{" "}
                {detalle.data.documento}
              </p>
            </>
          )}
        </Tarjeta>
      ) : null}
    </>
  );
}
