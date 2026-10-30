"use client";

import { useEffect, useState } from "react";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ETIQUETAS_MEDIO_PAGO,
  ETIQUETAS_PAGO,
  ETIQUETAS_PERIODO,
  PERIODOS,
  type EstadoPago,
  type Periodo,
} from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoSelectorLista,
  Cargando,
  EstadoVacio,
  BarraLista,
  FilaMovimiento,
  IconoBuscar,
  LimpiarFiltros,
  ListaConLateral,
  LogoBanco,
  Paginador,
  LogoMedioPago,
  RejillaMetricas,
  SelectorCalendario,
  SelectorSegmentado,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";
import type { BancoTransferencia } from "@appweb/ui";

import { ESTADO_PAGO, ETIQUETA_PAGO_RECIENTE } from "@/lib/estados-pago";
import { LOGO_MARCA, LOGO_MEDIO } from "@/lib/logos-pago";
import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";

import { CuadrosPago } from "./CuadrosPago";
import { DetallePago } from "./DetallePago";
import { MONEDA, conSigno, diaDeLima, diaYHora } from "@appweb/core/formato";

/** El filtro de la lista; sin filtro van todos, los pendientes arriba. */
const FILTROS: { id: EstadoPago | "TODOS"; etiqueta: string }[] = [
  { id: "TODOS", etiqueta: "Todos los estados" },
  { id: "PENDIENTE", etiqueta: "Por confirmar" },
  { id: "CONFIRMADO", etiqueta: "Confirmados" },
  { id: "RECHAZADO", etiqueta: "Rechazados" },
  { id: "REEMBOLSADO", etiqueta: "Reembolsados" },
  { id: "ANULADO", etiqueta: "Anulados" },
];

/** Las tarjetas que se miden en el periodo elegido contra el anterior. */
const TARJETAS_DEL_MES = [
  { estado: "CONFIRMADO", etiqueta: "Cobrado", menosEsMejor: false },
  { estado: "RECHAZADO", etiqueta: "Rechazado", menosEsMejor: true },
  { estado: "REEMBOLSADO", etiqueta: "Reembolsado", menosEsMejor: true },
] as const;

/**
 * Cola de pagos: lo que entro, lo que falta confirmar y lo que se devolvio.
 *
 * Cada fila abre el detalle del pago, no el del pedido: el pedido vive en su
 * seccion. Confirmar y rechazar se hacen desde ese detalle.
 */
export interface PropsPagos {
  puedeGestionar: boolean;
  /** Lleva a la seccion Pedidos con ese pedido abierto. */
  onVerPedido?: (pedidoId: string) => void;
  /** Pago abierto al llegar por `/pagos/<id>`. */
  pagoInicial?: string | null;
}

/** Cuantos pagos se ven por pagina. */
const PAGINA = 10;

/** Cuantos pagos trae el servidor; se reparten en paginas de `PAGINA`. */
const TOPE = 100;

/**
 * Segunda linea de la fila: el logo ya dice el medio, asi que solo va el
 * numero de operacion. Sin numero (pago pendiente) se nombra el medio.
 */
function subtituloDePago(
  medio: keyof typeof ETIQUETAS_MEDIO_PAGO,
  referencia: string | null,
  rechazosPrevios: number,
) {
  const base = referencia ? `Op. ${referencia}` : ETIQUETAS_MEDIO_PAGO[medio];
  if (rechazosPrevios === 0) return base;
  return `${base} · ${rechazosPrevios} ${rechazosPrevios === 1 ? "rechazo previo" : "rechazos previos"}`;
}

const BANCOS_TRANSFERENCIA = new Set<BancoTransferencia>([
  "BCP",
  "INTERBANK",
  "BBVA",
  "SCOTIABANK",
  "BANCO_NACION",
  "OTRO",
]);

export function Pagos({ puedeGestionar, onVerPedido, pagoInicial = null }: PropsPagos) {
  const trpc = useTRPC();
  const [filtro, setFiltro] = useState<EstadoPago | "TODOS">("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  // Dia de la lista (no de las tarjetas): "" muestra todos.
  const [diaLista, setDiaLista] = useState("");
  const [abierto, setAbierto] = useState<string | null>(pagoInicial);
  const [aviso, setAviso] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState<Periodo>("dia");
  // Un dia concreto del calendario; con fecha elegida manda sobre el periodo.
  const [fecha, setFecha] = useState("");

  // El pago abierto vive en la URL (`/pagos/<id>`): actualizar la pagina lo
  // conserva y "atras" vuelve a la lista.
  useEffect(() => {
    function alNavegar() {
      const [seccion, id] = window.location.pathname.replace(/^\/+/, "").split("/");
      if (seccion === "pagos") setAbierto(id ?? null);
    }
    window.addEventListener("popstate", alNavegar);
    return () => window.removeEventListener("popstate", alNavegar);
  }, []);

  function abrir(id: string | null) {
    setAbierto(id);
    window.history.pushState(null, "", id ? `/pagos/${id}` : "/pagos");
    window.scrollTo(0, 0);
  }

  // Las tarjetas van aparte de la lista: cambiar el periodo no recarga la
  // cola, y se conservan las cifras anteriores mientras llegan las nuevas.
  const metricas = useQuery({
    ...trpc.panel.pagos.metricas.queryOptions({
      periodo,
      ...(fecha ? { fecha } : {}),
    }),
    placeholderData: keepPreviousData,
  });

  // La busqueda la hace el servidor sobre todos los pagos; el dia y las paginas,
  // aqui, sobre lo que trae.
  const termino = busqueda.trim();
  const lista = useQuery({
    ...trpc.panel.pagos.listar.queryOptions({
      ...(filtro === "TODOS" ? {} : { estado: filtro }),
      ...(termino ? { busqueda: termino } : {}),
      limite: TOPE,
    }),
    placeholderData: keepPreviousData,
  });

  const coinciden = (lista.data?.pagos ?? []).filter(
    (p) => diaLista === "" || diaDeLima(new Date(p.creadoEn)) === diaLista,
  );
  const paginas = Math.max(1, Math.ceil(coinciden.length / PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = coinciden.slice((paginaActual - 1) * PAGINA, paginaActual * PAGINA);

  // En escritorio, tocar una fila la elige y la vista previa de al lado la
  // muestra; abrir el detalle es un boton. En movil no hay vista previa y la
  // fila abre el detalle directo.
  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  const seleccionado = visibles.find((p) => p.id === elegido) ?? visibles[0] ?? null;

  // Precarga el detalle de los pagos que se ven (diez como maximo): al elegir
  // uno, la vista previa ya esta en cache y aparece sin esperar al servidor.
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!escritorio) return;
    for (const pago of visibles) {
      void queryClient.prefetchQuery(trpc.panel.pagos.detalle.queryOptions({ pagoId: pago.id }));
    }
  }, [escritorio, visibles, queryClient, trpc]);

  if (abierto !== null) {
    return (
      <DetallePago
        pagoId={abierto}
        puedeGestionar={puedeGestionar}
        onVolver={(mensaje) => {
          abrir(null);
          setAviso(mensaje ?? null);
        }}
        {...(onVerPedido ? { onVerPedido } : {})}
      />
    );
  }

  const resumen = lista.data?.porEstado;
  const delPeriodo = metricas.data?.porEstado;
  const etiquetaAnterior = metricas.data?.etiquetaAnterior ?? "";
  const opciones = FILTROS.map((f) => {
    const cantidad = resumen && f.id !== "TODOS" ? resumen[f.id].cantidad : 0;
    return {
      valor: f.id,
      etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta,
    };
  });

  return (
    <>
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      {resumen && delPeriodo ? (
        <Tarjeta
          titulo={metricas.data?.titulo ?? ""}
          sinMarco
          acciones={
            <>
              <SelectorCalendario
                id="fecha-metricas-pagos"
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
        >
          <RejillaMetricas>
            {/* Lo pendiente es una cola, no un periodo: se muestra entero y sin comparar. */}
            <TarjetaMetrica
              etiqueta="Por confirmar"
              valor={MONEDA.format(resumen.PENDIENTE.monto)}
              serie={delPeriodo.PENDIENTE.serie}
              contexto={`${resumen.PENDIENTE.cantidad} ${resumen.PENDIENTE.cantidad === 1 ? "pago" : "pagos"} esperando`}
            />
            {TARJETAS_DEL_MES.map(({ estado, etiqueta, menosEsMejor }) => {
              const m = delPeriodo[estado];
              return (
                <TarjetaMetrica
                  key={estado}
                  etiqueta={etiqueta}
                  valor={MONEDA.format(m.monto)}
                  cambio={m.cambio}
                  serie={m.serie}
                  seriePrevia={m.seriePrevia}
                  diferencia={conSigno(m.monto - m.montoPrevio, MONEDA)}
                  anterior={{
                    etiqueta: etiquetaAnterior,
                    valor: MONEDA.format(m.montoPrevio),
                  }}
                  menosEsMejor={menosEsMejor}
                />
              );
            })}
          </RejillaMetricas>
        </Tarjeta>
      ) : null}

      <ListaConLateral
        filasPorPagina={PAGINA}
        barra={
          <BarraLista
            juntos
            buscador={
              <Campo
                id="busqueda-pagos"
                etiqueta="Buscar por pedido, cliente u operación"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Pedido, cliente u operación"
              />
            }
          >
            <Paginador pagina={paginaActual} paginas={paginas} onCambio={setPagina} />
            <CampoSelectorLista
              id="filtro-pagos"
              ancho="amplio"
              etiqueta="Estado del pago"
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => {
                setFiltro(valor as EstadoPago | "TODOS");
                setPagina(1);
              }}
            />
            <SelectorCalendario
              id="dia-lista-pagos"
              etiqueta="Pagos de un día"
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
        }
        lateral={
          seleccionado ? (
            <VistaPrevia logo={null} estado={{ texto: "", tono: "neutro" }} etiqueta="" monto="">
              <CuadrosPago
                pagoId={seleccionado.id}
                resumido
                principal={{
                  etiqueta:
                    puedeGestionar && seleccionado.estado === "PENDIENTE"
                      ? "Revisar pago"
                      : "Abrir pago",
                  onClick: () => abrir(seleccionado.id),
                }}
              />
            </VistaPrevia>
          ) : (
            <VistaPrevia
              vacio="Elige un pago de la lista para ver su resumen."
              logo={null}
              estado={{ texto: "", tono: "neutro" }}
              etiqueta=""
              monto=""
              filas={[]}
            />
          )
        }
      >
        <Tarjeta>
          {lista.isPending ? (
            <Cargando texto="Cargando pagos…" />
          ) : lista.isError ? (
            <Alerta tono="error">{lista.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin pagos"
              texto={
                busqueda || diaLista
                  ? "Ningún pago coincide con esa búsqueda o ese día."
                  : "No hay pagos en este estado."
              }
            />
          ) : (
            <div>
              {visibles.map((pago) => {
                const revisable =
                  puedeGestionar &&
                  pago.estado === "PENDIENTE" &&
                  pago.estadoPedido === "PENDIENTE_PAGO" &&
                  pago.medio !== "CONTRA_ENTREGA";
                const { dia, hora } = diaYHora(new Date(pago.creadoEn));
                return (
                  <FilaMovimiento
                    key={pago.id}
                    bloque
                    logo={
                      pago.medio === "TRANSFERENCIA" &&
                      pago.bancoTransferencia &&
                      BANCOS_TRANSFERENCIA.has(pago.bancoTransferencia as BancoTransferencia) ? (
                        <LogoBanco banco={pago.bancoTransferencia as BancoTransferencia} />
                      ) : (
                        <LogoMedioPago
                          medio={pago.tarjeta ? LOGO_MARCA[pago.tarjeta] : LOGO_MEDIO[pago.medio]}
                          nombre={ETIQUETAS_MEDIO_PAGO[pago.medio]}
                        />
                      )
                    }
                    titulo={pago.codigo}
                    detalle={pago.cliente}
                    // Corto a proposito: la operacion completa y quien confirmo estan en el detalle.
                    subtitulo={subtituloDePago(pago.medio, pago.referencia, pago.rechazosPrevios)}
                    centro={[dia, hora]}
                    estado={{
                      texto: ETIQUETA_PAGO_RECIENTE[pago.estado] ?? ETIQUETAS_PAGO[pago.estado],
                      tono: ESTADO_PAGO[pago.estado].tono,
                      icono: ESTADO_PAGO[pago.estado].icono,
                    }}
                    valor={MONEDA.format(pago.monto)}
                    accion={
                      revisable ? <Boton onClick={() => abrir(pago.id)}>Revisar</Boton> : undefined
                    }
                    seleccionada={escritorio && seleccionado?.id === pago.id}
                    onAbrir={() => (escritorio ? setElegido(pago.id) : abrir(pago.id))}
                    etiquetaAbrir={`${escritorio ? "Elegir" : "Ver"} pago de ${pago.codigo}`}
                  />
                );
              })}
            </div>
          )}
        </Tarjeta>
      </ListaConLateral>
    </>
  );
}
