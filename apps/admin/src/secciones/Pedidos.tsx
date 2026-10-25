"use client";

import { useEffect, useMemo, useState } from "react";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ETIQUETAS,
  ETIQUETAS_PERIODO,
  PERIODOS,
  type EstadoPedido,
  type Periodo,
} from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Campo,
  CampoSelectorLista,
  Cargando,
  EstadoVacio,
  FilaMovimiento,
  IconoBuscar,
  IconoPedidos,
  ListaConLateral,
  LogoIcono,
  RejillaMetricas,
  SelectorCalendario,
  SelectorSegmentado,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";

import { CuadrosPedido } from "./CuadrosPedido";
import { DetallePedido } from "./DetallePedido";
import { conSigno, cuandoFue } from "@appweb/core/formato";

/** Ambar mientras espera a alguien, verde cuando termino bien, rojo si se cayo. */
export function tonoDeEstado(estado: EstadoPedido): "exito" | "alerta" | "error" | "neutro" {
  if (estado === "PENDIENTE_PAGO") return "alerta";
  if (estado === "ENTREGADO") return "exito";
  if (estado === "CANCELADO") return "error";
  return "neutro";
}

/** El filtro de la lista, en el orden en que se trabaja un pedido. */
const FILTROS: { id: EstadoPedido | "TODOS"; etiqueta: string }[] = [
  { id: "TODOS", etiqueta: "Todos los estados" },
  { id: "PENDIENTE_PAGO", etiqueta: "Por pagar" },
  { id: "PAGADO", etiqueta: "Por preparar" },
  { id: "PREPARANDO", etiqueta: "Preparando" },
  { id: "ENVIADO", etiqueta: "Enviados" },
  { id: "ENTREGADO", etiqueta: "Entregados" },
  { id: "CANCELADO", etiqueta: "Cancelados" },
];

/** Las tarjetas que se miden en el periodo elegido contra el anterior. */
const TARJETAS_DEL_PERIODO = [
  { clave: "creados", etiqueta: "Pedidos", menosEsMejor: false },
  { clave: "entregados", etiqueta: "Entregados", menosEsMejor: false },
  { clave: "cancelados", etiqueta: "Cancelados", menosEsMejor: true },
] as const;

/** "+3 pedidos": la diferencia contada, no en soles. */
function diferenciaDePedidos(diferencia: number): string {
  return `${conSigno(diferencia)} ${Math.abs(diferencia) === 1 ? "pedido" : "pedidos"}`;
}

/** Cuantos pedidos se ven, como en Pagos. Para otros se busca o se filtra. */
const PAGINA = 10;

/**
 * Seccion de pedidos: la orden y en que va. Lista con vista previa al lado
 * (escritorio) y, al abrir uno, su detalle.
 *
 * Ninguna regla vive aqui. Que se puede confirmar, a que estado se puede
 * pasar y cuanto stock se mueve lo deciden @appweb/core y @appweb/api; esta
 * pantalla muestra y envia.
 */
export interface PropsPedidos {
  puedeGestionar: boolean;
  /** Pedido que se abre al entrar: llega desde el detalle de un pago. */
  pedidoInicial?: string | null;
}

export function Pedidos({ puedeGestionar, pedidoInicial = null }: PropsPedidos) {
  const trpc = useTRPC();
  const [filtro, setFiltro] = useState<EstadoPedido | "TODOS">("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(pedidoInicial);

  const [periodo, setPeriodo] = useState<Periodo>("dia");
  // Un dia concreto del calendario; con fecha elegida manda sobre el periodo.
  const [fecha, setFecha] = useState("");
  // Las tarjetas van aparte de la lista: cambiar el periodo no recarga la
  // lista, y se conservan las cifras anteriores mientras llegan las nuevas.
  const metricas = useQuery({
    ...trpc.panel.pedidos.metricas.queryOptions({ periodo, ...(fecha ? { fecha } : {}) }),
    placeholderData: keepPreviousData,
  });

  const lista = useQuery(
    trpc.panel.pedidos.listar.queryOptions(filtro === "TODOS" ? {} : { estado: filtro }),
  );

  /**
   * Filtro local por codigo, cliente o correo (sin consulta por tecla) sobre
   * todo lo que trae la lista; luego solo se muestran los diez primeros.
   */
  const visibles = useMemo(() => {
    const pedidos = lista.data?.pedidos ?? [];
    const termino = busqueda.trim().toLowerCase();
    const coinciden =
      termino === ""
        ? pedidos
        : pedidos.filter(
            (p) =>
              p.codigo.toLowerCase().includes(termino) ||
              p.cliente.toLowerCase().includes(termino) ||
              p.email.toLowerCase().includes(termino),
          );
    return coinciden.slice(0, PAGINA);
  }, [busqueda, lista.data]);

  // En escritorio, tocar una fila la elige y la vista previa la muestra; en
  // movil no hay vista previa y la fila abre el detalle directo.
  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  const seleccionado = visibles.find((p) => p.id === elegido) ?? visibles[0] ?? null;

  // Precarga el detalle de los que se ven: al elegir uno, ya esta en cache.
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!escritorio) return;
    for (const pedido of visibles) {
      void queryClient.prefetchQuery(
        trpc.panel.pedidos.detalle.queryOptions({ pedidoId: pedido.id }),
      );
    }
  }, [escritorio, visibles, queryClient, trpc]);

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
  const opciones = FILTROS.map((f) => {
    const cantidad = conteo && f.id !== "TODOS" ? conteo[f.id] : 0;
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });

  const cifras = metricas.data;

  return (
    <>
      {cifras ? (
        <Tarjeta
          titulo={cifras.titulo}
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
                id="fecha-metricas-pedidos"
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
            {/* Lo que espera es una cola, no un periodo: se muestra entero y sin comparar. */}
            <TarjetaMetrica
              etiqueta="Por preparar"
              valor={String(cifras.porPreparar.cantidad)}
              serie={cifras.porPreparar.serie}
              contexto={
                cifras.porPreparar.masAntiguo
                  ? `${cifras.porPreparar.cantidad} ${cifras.porPreparar.cantidad === 1 ? "pedido espera" : "pedidos esperan"} · el más antiguo ${cuandoFue(new Date(cifras.porPreparar.masAntiguo)).toLowerCase()}`
                  : "Nada esperando"
              }
            />
            {TARJETAS_DEL_PERIODO.map(({ clave, etiqueta, menosEsMejor }) => {
              const m = cifras[clave];
              return (
                <TarjetaMetrica
                  key={clave}
                  etiqueta={etiqueta}
                  valor={String(m.cantidad)}
                  cambio={m.cambio}
                  serie={m.serie}
                  seriePrevia={m.seriePrevia}
                  diferencia={diferenciaDePedidos(m.cantidad - m.cantidadPrevia)}
                  anterior={{ etiqueta: cifras.etiquetaAnterior, valor: String(m.cantidadPrevia) }}
                  menosEsMejor={menosEsMejor}
                />
              );
            })}
          </RejillaMetricas>
        </Tarjeta>
      ) : null}

      <ListaConLateral
        barra={
          <BarraLista
            juntos
            buscador={
              <Campo
                id="busqueda-pedidos"
                etiqueta="Buscar por código, cliente o correo"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={setBusqueda}
                placeholder="Pedido, cliente o correo"
              />
            }
          >
            <CampoSelectorLista
              id="filtro-pedidos"
              ancho="amplio"
              etiqueta="Estado del pedido"
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => setFiltro(valor as EstadoPedido | "TODOS")}
            />
          </BarraLista>
        }
        lateral={
          <VistaPrevia
            logo={null}
            estado={{ texto: "", tono: "neutro" }}
            etiqueta=""
            monto=""
            {...(seleccionado ? {} : { vacio: "Elige un pedido de la lista para ver su resumen." })}
          >
            {seleccionado ? (
              <CuadrosPedido
                pedidoId={seleccionado.id}
                principal={{ etiqueta: "Abrir pedido", onClick: () => setAbierto(seleccionado.id) }}
              />
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {lista.isPending ? (
            <Cargando texto="Cargando pedidos…" />
          ) : lista.isError ? (
            <Alerta tono="error">{lista.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin pedidos"
              texto={
                busqueda
                  ? "Ningún pedido coincide con esa búsqueda."
                  : "No hay pedidos en este estado."
              }
            />
          ) : (
            <div>
              {visibles.map((pedido) => (
                <FilaMovimiento
                  key={pedido.id}
                  logo={<LogoIcono icono={<IconoPedidos tamano={16} />} nombre="Pedido" />}
                  titulo={pedido.codigo}
                  detalle={pedido.cliente}
                  subtitulo={`${pedido.lineas} ${pedido.lineas === 1 ? "producto" : "productos"} · ${cuandoFue(new Date(pedido.creadoEn))}`}
                  estado={{ texto: ETIQUETAS[pedido.estado], tono: tonoDeEstado(pedido.estado) }}
                  valor={pedido.departamento}
                  seleccionada={escritorio && seleccionado?.id === pedido.id}
                  onAbrir={() => (escritorio ? setElegido(pedido.id) : setAbierto(pedido.id))}
                  etiquetaAbrir={`${escritorio ? "Elegir" : "Ver"} pedido ${pedido.codigo}`}
                />
              ))}
            </div>
          )}
        </Tarjeta>
      </ListaConLateral>
    </>
  );
}
