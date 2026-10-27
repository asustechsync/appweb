"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { ETIQUETAS, pasosDelPedido, type EstadoPedido } from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Boton,
  CabeceraDetalle,
  CampoSelectorLista,
  Cargando,
  CuadroBento,
  CuadroMonto,
  EstadoVacio,
  FilaPedido,
  IconoFlechaIzquierda,
  IconoPedidos,
  IconoTicket,
  IconoUbicacion,
  LineaEstados,
  LogoFoto,
  LogoIcono,
  Paginador,
  RejillaBento,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  TarjetaPedido,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";
import { FECHA_HORA, MONEDA, diaYHora } from "@appweb/core/formato";

/** Verde cuando llego, ambar mientras espera el pago, rojo si se cancelo. */
function tonoDeEstado(estado: EstadoPedido): "exito" | "alerta" | "error" | "neutro" {
  if (estado === "ENTREGADO") return "exito";
  if (estado === "PENDIENTE_PAGO") return "alerta";
  if (estado === "CANCELADO") return "error";
  return "neutro";
}

/** Barra de la fila: los pasos tras el pedido recibido, con los ya cumplidos. Cancelado, sin barra. */
function avanceDeEntrega(estado: EstadoPedido) {
  const pasos = pasosDelPedido(estado).slice(1);
  if (pasos.length === 0) return {};
  return {
    avance: { hechos: pasos.filter((p) => p.situacion === "hecho").length, total: pasos.length },
  };
}

type Filtro = "TODOS" | "EN_CURSO" | "ENTREGADO" | "CANCELADO";

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "TODOS", etiqueta: "Todos mis pedidos" },
  { id: "EN_CURSO", etiqueta: "En curso" },
  { id: "ENTREGADO", etiqueta: "Entregados" },
  { id: "CANCELADO", etiqueta: "Cancelados" },
];

function cumpleFiltro(estado: EstadoPedido, filtro: Filtro): boolean {
  if (filtro === "TODOS") return true;
  if (filtro === "EN_CURSO") return estado !== "ENTREGADO" && estado !== "CANCELADO";
  return estado === filtro;
}

/** Cuantos pedidos se ven por pagina. */
const PAGINA = 8;

/** Los pedidos del cliente: cifras arriba, la lista y, al abrir uno, su detalle. */
export function Pedidos() {
  const trpc = useTRPC();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [pagina, setPagina] = useState(1);

  const lista = useQuery(trpc.cuenta.pedidos.queryOptions());

  const coinciden = useMemo(
    () => (lista.data ?? []).filter((p) => cumpleFiltro(p.estado as EstadoPedido, filtro)),
    [filtro, lista.data],
  );
  const paginas = Math.max(1, Math.ceil(coinciden.length / PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = coinciden.slice((paginaActual - 1) * PAGINA, paginaActual * PAGINA);

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

  if (abierto !== null) {
    return <DetallePedido codigo={abierto} onVolver={() => setAbierto(null)} />;
  }

  const pedidos = lista.data;
  const contar = (id: Filtro) =>
    pedidos.filter((p) => cumpleFiltro(p.estado as EstadoPedido, id)).length;
  const opciones = FILTROS.map((f) => {
    const cantidad = f.id === "TODOS" ? 0 : contar(f.id);
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });
  const gastado = pedidos
    .filter((p) => p.estado !== "CANCELADO" && p.estado !== "PENDIENTE_PAGO")
    .reduce((suma, p) => suma + p.total, 0);
  const porPagar = pedidos.filter((p) => p.estado === "PENDIENTE_PAGO").length;

  return (
    <>
      <RejillaMetricas>
        <TarjetaMetrica
          etiqueta="En curso"
          valor={String(contar("EN_CURSO"))}
          contexto={porPagar > 0 ? `${porPagar} esperando tu pago` : "Preparándose o en camino"}
        />
        <TarjetaMetrica
          etiqueta="Entregados"
          valor={String(contar("ENTREGADO"))}
          contexto={`De ${pedidos.length} ${pedidos.length === 1 ? "pedido" : "pedidos"}`}
        />
        <TarjetaMetrica
          etiqueta="Comprado"
          valor={MONEDA.format(gastado)}
          contexto="Sin contar cancelados ni por pagar"
        />
      </RejillaMetricas>

      <BarraLista>
        <Paginador pagina={paginaActual} paginas={paginas} onCambio={setPagina} />
        <CampoSelectorLista
          id="filtro-mis-pedidos"
          ancho="amplio"
          etiqueta="Qué pedidos ver"
          etiquetaOculta
          valor={filtro}
          opciones={opciones}
          onCambio={(valor) => {
            setFiltro(valor as Filtro);
            setPagina(1);
          }}
        />
      </BarraLista>

      <Tarjeta>
        {visibles.length === 0 ? (
          <EstadoVacio titulo="Sin pedidos" texto="No tienes pedidos en este estado." />
        ) : (
          <div>
            {visibles.map((pedido) => {
              const estado = pedido.estado as EstadoPedido;
              const { dia, hora } = diaYHora(new Date(pedido.creadoEn));
              return (
                <FilaPedido
                  key={pedido.codigo}
                  logo={<LogoFoto src={pedido.imagen} nombre={pedido.primerProducto ?? "Pedido"} />}
                  titulo={pedido.codigo}
                  detalle={MONEDA.format(pedido.total)}
                  contenido={`${pedido.lineas} ${pedido.lineas === 1 ? "producto" : "productos"} · ${pedido.envioMetodo}`}
                  centro={[dia, hora]}
                  estado={{ texto: ETIQUETAS[estado], tono: tonoDeEstado(estado) }}
                  {...avanceDeEntrega(estado)}
                  onAbrir={() => setAbierto(pedido.codigo)}
                  etiquetaAbrir={`Ver pedido ${pedido.codigo}`}
                />
              );
            })}
          </div>
        )}
      </Tarjeta>
    </>
  );
}

/** Un pedido propio: en que va, a donde llega, el comprobante y lo comprado. */
function DetallePedido({ codigo, onVolver }: { codigo: string; onVolver: () => void }) {
  const trpc = useTRPC();
  const detalle = useQuery(trpc.cuenta.pedido.queryOptions({ codigo }));

  const volver = (
    <Boton variante="secundario" onClick={onVolver}>
      <IconoFlechaIzquierda tamano={16} />
      Mis pedidos
    </Boton>
  );

  if (detalle.isPending) return <Cargando texto="Cargando el pedido…" />;
  if (detalle.isError) {
    return (
      <>
        <CabeceraDetalle titulo={`Pedido ${codigo}`} acciones={volver} />
        <Alerta tono="error">{detalle.error.message}</Alerta>
      </>
    );
  }

  const p = detalle.data;
  const estado = p.estado as EstadoPedido;

  return (
    <>
      <CabeceraDetalle titulo={`Pedido ${p.codigo}`} acciones={volver} />

      <RejillaBento>
        <CuadroMonto
          logo={<LogoIcono icono={<IconoPedidos tamano={16} />} nombre="Pedido" />}
          estado={{ texto: ETIQUETAS[estado], tono: tonoDeEstado(estado) }}
          etiqueta="Total"
          monto={MONEDA.format(p.total)}
          detalle={FECHA_HORA.format(new Date(p.creadoEn))}
        />
        <CuadroBento
          icono={<IconoUbicacion tamano={16} />}
          titulo={`Envío · ${p.envioMetodo}`}
          ancho="ancho"
          detalle={[`${p.envioDistrito}, ${p.envioProvincia}`, p.envioReferencia]
            .filter(Boolean)
            .join(" · ")}
        >
          {p.envioCalle}
        </CuadroBento>
        <CuadroBento icono={<IconoTicket tamano={16} />} titulo="Comprobante" ancho="ancho">
          {p.comprobante === "FACTURA" ? "Factura" : "Boleta"} {p.documento}
        </CuadroBento>
      </RejillaBento>

      <Tarjeta titulo="Seguimiento">
        <LineaEstados pasos={pasosDelPedido(estado)} />
      </Tarjeta>

      <TarjetaPedido
        titulo="Productos"
        items={p.items}
        subtotal={p.subtotal}
        descuento={p.descuento}
        costoEnvio={p.costoEnvio}
        total={p.total}
      />
    </>
  );
}
