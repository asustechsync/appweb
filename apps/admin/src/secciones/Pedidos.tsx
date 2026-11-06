"use client";

import { useEffect, useMemo, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS, ESTADOS_DESPACHO, pasosDelPedido, type EstadoPedido } from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Campo,
  CampoSelectorLista,
  Cargando,
  EstadoVacio,
  FilaPedido,
  IconoBuscar,
  LimpiarFiltros,
  ListaConLateral,
  Paginador,
  LogoFoto,
  SelectorCalendario,
  Tarjeta,
  VistaPrevia,
} from "@appweb/ui";

import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";
import { urlVisible } from "@/lib/url-visible";

import { CuadrosPedido } from "./CuadrosPedido";
import { DetallePedido } from "./DetallePedido";
import { diaDeLima, diaYHora } from "@appweb/core/formato";

/** Ambar mientras espera a alguien, verde cuando termino bien, rojo si se cayo. */
export function tonoDeEstado(estado: EstadoPedido): "exito" | "alerta" | "error" | "neutro" {
  if (estado === "PENDIENTE_PAGO") return "alerta";
  if (estado === "ENTREGADO") return "exito";
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

/** Lo que el almacen mueve (pagado, preparando, enviado): un solo filtro, el detalle va en Envios. */
type FiltroPedidos = "TODOS" | "PENDIENTE_PAGO" | "EN_PROCESO" | "ENTREGADO" | "CANCELADO";

/** El filtro de la lista: lo que importa para decidir, sin repetir los pasos de Envios. */
const FILTROS: { id: FiltroPedidos; etiqueta: string }[] = [
  { id: "TODOS", etiqueta: "Todos los estados" },
  { id: "PENDIENTE_PAGO", etiqueta: "Por pagar" },
  { id: "EN_PROCESO", etiqueta: "En proceso" },
  { id: "ENTREGADO", etiqueta: "Entregados" },
  { id: "CANCELADO", etiqueta: "Cancelados" },
];

/** Los estados que cubre cada filtro; sin lista, todos. */
function estadosDelFiltro(filtro: FiltroPedidos): EstadoPedido[] | undefined {
  if (filtro === "TODOS") return undefined;
  if (filtro === "EN_PROCESO") return [...ESTADOS_DESPACHO];
  return [filtro];
}

/** Cuantos pedidos se ven por pagina. */
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
  const [filtro, setFiltro] = useState<FiltroPedidos>("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  // Dia de la lista (no de las tarjetas): "" muestra todos.
  const [diaLista, setDiaLista] = useState("");
  const [abierto, setAbierto] = useState<string | null>(pedidoInicial);

  const lista = useQuery(
    trpc.panel.pedidos.listar.queryOptions(
      filtro === "TODOS" ? {} : { estados: estadosDelFiltro(filtro) ?? [] },
    ),
  );

  /**
   * Filtro local por dia, codigo, cliente o correo (sin consulta por tecla) sobre
   * todo lo que trae la lista; luego se muestran de diez en diez.
   */
  const coinciden = useMemo(() => {
    const pedidos = lista.data?.pedidos ?? [];
    const termino = busqueda.trim().toLowerCase();
    return pedidos.filter(
      (p) =>
        (diaLista === "" || diaDeLima(new Date(p.creadoEn)) === diaLista) &&
        (termino === "" ||
          p.codigo.toLowerCase().includes(termino) ||
          p.cliente.toLowerCase().includes(termino) ||
          p.email.toLowerCase().includes(termino)),
    );
  }, [busqueda, diaLista, lista.data]);
  const paginas = Math.max(1, Math.ceil(coinciden.length / PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = useMemo(
    () => coinciden.slice((paginaActual - 1) * PAGINA, paginaActual * PAGINA),
    [coinciden, paginaActual],
  );

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
    const cantidad =
      conteo && f.id !== "TODOS"
        ? (estadosDelFiltro(f.id) ?? []).reduce((suma, estado) => suma + conteo[estado], 0)
        : 0;
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });

  return (
    <ListaConLateral
      filasPorPagina={PAGINA}
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
        <BarraLista
          fondoBuscador="control"
          buscador={
            <Campo
              id="busqueda-pedidos"
              etiqueta="Buscar por código, cliente o correo"
              etiquetaOculta
              icono={<IconoBuscar tamano={16} />}
              valor={busqueda}
              onCambio={(valor) => {
                setBusqueda(valor);
                setPagina(1);
              }}
              placeholder="Pedido, cliente o correo"
            />
          }
        >
          <Paginador pagina={paginaActual} paginas={paginas} onCambio={setPagina} />
          <CampoSelectorLista
            id="filtro-pedidos"
            ancho="amplio"
            etiqueta="Estado del pedido"
            etiquetaOculta
            valor={filtro}
            opciones={opciones}
            onCambio={(valor) => {
              setFiltro(valor as FiltroPedidos);
              setPagina(1);
            }}
          />
          <SelectorCalendario
            id="dia-lista-pedidos"
            etiqueta="Pedidos de un día"
            etiquetaOculta
            placeholder="Elegir día"
            valor={diaLista}
            onCambio={(valor) => {
              setDiaLista(valor);
              setPagina(1);
            }}
            limpiable
          />
          {filtro !== "TODOS" || diaLista !== "" || busqueda !== "" ? (
            <LimpiarFiltros
              onClick={() => {
                setFiltro("TODOS");
                setDiaLista("");
                setBusqueda("");
                setPagina(1);
              }}
            />
          ) : null}
        </BarraLista>
        {lista.isPending ? (
          <Cargando texto="Cargando pedidos…" />
        ) : lista.isError ? (
          <Alerta tono="error">{lista.error.message}</Alerta>
        ) : visibles.length === 0 ? (
          <EstadoVacio
            titulo="Sin pedidos"
            texto={
              busqueda || diaLista
                ? "Ningún pedido coincide con esa búsqueda o ese día."
                : "No hay pedidos en este estado."
            }
          />
        ) : (
          <div>
            {visibles.map((pedido) => {
              const { dia, hora } = diaYHora(new Date(pedido.creadoEn));
              return (
                <FilaPedido
                  key={pedido.id}
                  logo={
                    <LogoFoto
                      src={urlVisible(pedido.imagen)}
                      nombre={pedido.primerProducto ?? "Pedido"}
                    />
                  }
                  titulo={pedido.codigo}
                  detalle={pedido.cliente}
                  contenido={`${pedido.lineas} ${pedido.lineas === 1 ? "producto" : "productos"} · ${pedido.unidades} ${pedido.unidades === 1 ? "unidad" : "unidades"}`}
                  centro={[dia, hora]}
                  estado={{
                    texto: pedido.porConfirmar ? "Por confirmar" : ETIQUETAS[pedido.estado],
                    tono: tonoDeEstado(pedido.estado),
                  }}
                  {...avanceDeEntrega(pedido.estado)}
                  seleccionada={escritorio && seleccionado?.id === pedido.id}
                  onAbrir={() => (escritorio ? setElegido(pedido.id) : setAbierto(pedido.id))}
                  etiquetaAbrir={`${escritorio ? "Elegir" : "Ver"} pedido ${pedido.codigo}`}
                />
              );
            })}
          </div>
        )}
      </Tarjeta>
    </ListaConLateral>
  );
}
