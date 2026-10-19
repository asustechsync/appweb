"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { ETIQUETAS, ETIQUETAS_MEDIO_PAGO, type EstadoPedido } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  EstadoVacio,
  FilaLista,
  Insignia,
  Pestanas,
  Tarjeta,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

import { DetallePedido } from "./DetallePedido";
import { FECHA_HORA, MONEDA } from "@appweb/core/formato";

/** Ambar mientras espera a alguien, verde cuando termino bien, rojo si se cayo. */
export function tonoDeEstado(estado: EstadoPedido): "exito" | "alerta" | "error" | "neutro" {
  if (estado === "PENDIENTE_PAGO") return "alerta";
  if (estado === "ENTREGADO") return "exito";
  if (estado === "CANCELADO") return "error";
  return "neutro";
}

/** Pestañas en el orden en que se trabaja un pedido. "Todos" al final. */
const PESTANAS: { id: EstadoPedido | "TODOS"; etiqueta: string }[] = [
  { id: "PENDIENTE_PAGO", etiqueta: "Por confirmar" },
  { id: "PAGADO", etiqueta: "Pagados" },
  { id: "PREPARANDO", etiqueta: "Preparando" },
  { id: "ENVIADO", etiqueta: "Enviados" },
  { id: "ENTREGADO", etiqueta: "Entregados" },
  { id: "CANCELADO", etiqueta: "Cancelados" },
  { id: "TODOS", etiqueta: "Todos" },
];

/**
 * Seccion de pedidos: la lista por estado y, al abrir uno, su detalle.
 *
 * Ninguna regla vive aqui. Que se puede confirmar, a que estado se puede
 * pasar y cuanto stock se mueve lo deciden @appweb/core y @appweb/api; esta
 * pantalla muestra y envia.
 */
export function Pedidos({ puedeGestionar }: { puedeGestionar: boolean }) {
  const trpc = useTRPC();
  const [pestana, setPestana] = useState<EstadoPedido | "TODOS">("PENDIENTE_PAGO");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  const lista = useQuery(
    trpc.panel.pedidos.listar.queryOptions(pestana === "TODOS" ? {} : { estado: pestana }),
  );

  /** Filtro local por codigo, cliente o correo: sin consulta por tecla. */
  const visibles = useMemo(() => {
    const pedidos = lista.data?.pedidos ?? [];
    const termino = busqueda.trim().toLowerCase();
    if (termino === "") return pedidos;
    return pedidos.filter(
      (p) =>
        p.codigo.toLowerCase().includes(termino) ||
        p.cliente.toLowerCase().includes(termino) ||
        p.email.toLowerCase().includes(termino),
    );
  }, [busqueda, lista.data]);

  if (abierto !== null) {
    return (
      <DetallePedido
        pedidoId={abierto}
        puedeGestionar={puedeGestionar}
        onVolver={() => setAbierto(null)}
      />
    );
  }

  const conteo = lista.data?.porEstado;
  // El numero solo donde hay pedidos: destaca lo que espera y deja caber las
  // siete pestañas en escritorio.
  const opciones = PESTANAS.map((p) => {
    const cantidad = conteo && p.id !== "TODOS" ? conteo[p.id] : 0;
    return { id: p.id, etiqueta: cantidad > 0 ? `${p.etiqueta} (${cantidad})` : p.etiqueta };
  });

  return (
    <Tarjeta
      titulo="Pedidos"
      acciones={
        <Campo
          id="busqueda-pedidos"
          etiqueta="Buscar por código, cliente o correo"
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar…"
        />
      }
    >
      <Pestanas
        etiqueta="Estado del pedido"
        opciones={opciones}
        activa={pestana}
        onCambio={(id) => setPestana(id as EstadoPedido | "TODOS")}
      />

      {lista.isPending ? (
        <Cargando texto="Cargando pedidos…" />
      ) : lista.isError ? (
        <Alerta tono="error">{lista.error.message}</Alerta>
      ) : visibles.length === 0 ? (
        <EstadoVacio
          titulo="Sin pedidos"
          texto={
            busqueda ? "Ningún pedido coincide con esa búsqueda." : "No hay pedidos en este estado."
          }
        />
      ) : (
        visibles.map((pedido) => (
          <FilaLista
            key={pedido.id}
            acciones={
              <Boton variante="secundario" onClick={() => setAbierto(pedido.id)}>
                Ver pedido
              </Boton>
            }
          >
            <strong>
              {pedido.codigo} · {MONEDA.format(pedido.total)}
            </strong>
            <span>
              {pedido.cliente} · {pedido.email}
            </span>
            <span>
              {FECHA_HORA.format(new Date(pedido.creadoEn))} · {pedido.lineas}{" "}
              {pedido.lineas === 1 ? "producto" : "productos"} · {pedido.departamento}
            </span>
            <span>
              <Insignia tono={tonoDeEstado(pedido.estado)}>{ETIQUETAS[pedido.estado]}</Insignia>{" "}
              <Insignia tono="neutro">{ETIQUETAS_MEDIO_PAGO[pedido.medioPago]}</Insignia>
            </span>
          </FilaLista>
        ))
      )}
    </Tarjeta>
  );
}
