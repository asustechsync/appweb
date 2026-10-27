"use client";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ETIQUETA_TIPO_DOCUMENTO,
  ETIQUETAS_ESTADO_RECLAMO,
  ETIQUETAS_TIPO_BIEN,
  ETIQUETAS_TIPO_RECLAMO,
  type EstadoReclamo,
} from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Boton,
  Campo,
  CampoSelectorLista,
  CampoTexto,
  Cargando,
  CuadroBento,
  CuadroMonto,
  EstadoVacio,
  FilaPedido,
  Formulario,
  IconoBuscar,
  IconoCatalogo,
  IconoLibro,
  IconoMensaje,
  IconoUsuario,
  LimpiarFiltros,
  ListaConLateral,
  LogoIcono,
  Paginador,
  RejillaBento,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
  type AccionBento,
} from "@appweb/ui";

import { useEscritorio } from "@/lib/use-escritorio";
import { usePaginado } from "@/lib/use-paginado";
import { useTRPC } from "@/lib/trpc";

import { FECHA, FECHA_HORA, MONEDA, diaYHora } from "@appweb/core/formato";

type FiltroReclamos = EstadoReclamo | "TODOS" | "VENCIDOS";

const FILTROS: { id: FiltroReclamos; etiqueta: string }[] = [
  { id: "PENDIENTE", etiqueta: "Por responder" },
  { id: "VENCIDOS", etiqueta: "Vencidos" },
  { id: "RESPONDIDO", etiqueta: "Respondidos" },
  { id: "TODOS", etiqueta: "Todos" },
];

function cumpleFiltro(
  r: { estado: EstadoReclamo; diasParaVencer: number | null },
  filtro: FiltroReclamos,
): boolean {
  if (filtro === "TODOS") return true;
  if (filtro === "VENCIDOS") return r.diasParaVencer !== null && r.diasParaVencer < 0;
  return r.estado === filtro;
}

/** Rojo si ya vencio o vence en dos dias; ambar mientras corre; verde respondido. */
function plazo(estado: EstadoReclamo, dias: number | null, vence: string) {
  if (estado === "RESPONDIDO" || dias === null) {
    return { tono: "exito" as const, texto: ETIQUETAS_ESTADO_RECLAMO[estado] };
  }
  if (dias < 0)
    return { tono: "error" as const, texto: `Venció el ${FECHA.format(new Date(vence))}` };
  const texto =
    dias === 0
      ? "Vence hoy"
      : `Vence en ${dias} ${dias === 1 ? "día" : "días"} · ${FECHA.format(new Date(vence))}`;
  return { tono: dias <= 2 ? ("error" as const) : ("alerta" as const), texto };
}

/** Lo corto para la fila: "Vence en 3 días", sin la fecha. */
function plazoCorto(estado: EstadoReclamo, dias: number | null) {
  if (estado === "RESPONDIDO" || dias === null) {
    return { tono: "exito" as const, texto: ETIQUETAS_ESTADO_RECLAMO[estado] };
  }
  if (dias < 0) return { tono: "error" as const, texto: "Vencido" };
  if (dias === 0) return { tono: "error" as const, texto: "Vence hoy" };
  return {
    tono: dias <= 2 ? ("error" as const) : ("alerta" as const),
    texto: `Vence en ${dias} ${dias === 1 ? "día" : "días"}`,
  };
}

/** Cuantas hojas se ven por pagina. */
const PAGINA = 10;

/**
 * Libro de Reclamaciones: hojas por responder, con el plazo legal a la vista.
 * La hoja no se edita; lo unico que se escribe aqui es la respuesta, y llega
 * al consumidor por correo.
 */
export function Reclamos() {
  const trpc = useTRPC();
  const [filtro, setFiltro] = useState<FiltroReclamos>("PENDIENTE");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  // Se traen todas y se filtra aqui: las cifras de arriba no dependen del filtro.
  const lista = useQuery(trpc.panel.reclamos.listar.queryOptions({}));
  const todos = lista.data?.reclamos ?? [];

  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data?.reclamos ?? [])
      .filter(
        (r) =>
          cumpleFiltro(r, filtro) &&
          (termino === "" ||
            r.codigo.toLowerCase().includes(termino) ||
            r.nombre.toLowerCase().includes(termino) ||
            r.email.toLowerCase().includes(termino)),
      )
      .sort((a, b) =>
        // Por responder, lo que vence antes primero; lo demas, lo mas nuevo primero.
        filtro === "PENDIENTE" || filtro === "VENCIDOS"
          ? a.creadoEn.localeCompare(b.creadoEn)
          : b.creadoEn.localeCompare(a.creadoEn),
      );
  }, [busqueda, filtro, lista.data]);
  const { pagina, paginas, setPagina, visibles } = usePaginado(coinciden, PAGINA);

  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  const seleccionado = visibles.find((r) => r.id === elegido) ?? visibles[0] ?? null;

  // Precarga la hoja de los que se ven: al elegir uno, ya esta en cache.
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!escritorio) return;
    for (const reclamo of visibles) {
      void queryClient.prefetchQuery(
        trpc.panel.reclamos.detalle.queryOptions({ reclamoId: reclamo.id }),
      );
    }
  }, [escritorio, visibles, queryClient, trpc]);

  if (abierto !== null) {
    return <DetalleReclamo reclamoId={abierto} onVolver={() => setAbierto(null)} />;
  }

  const contar = (id: FiltroReclamos) => todos.filter((r) => cumpleFiltro(r, id)).length;
  const opciones = FILTROS.map((f) => {
    const cantidad = f.id === "TODOS" ? 0 : contar(f.id);
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });
  const porVencer = todos.filter(
    (r) => r.diasParaVencer !== null && r.diasParaVencer >= 0 && r.diasParaVencer <= 2,
  ).length;
  const quejas = todos.filter((r) => r.tipo === "QUEJA").length;

  return (
    <>
      <Tarjeta titulo="Libro de Reclamaciones" sinMarco>
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="Por responder"
            valor={String(contar("PENDIENTE"))}
            contexto="El plazo legal corre desde que se registra"
          />
          <TarjetaMetrica
            etiqueta="Por vencer"
            valor={String(porVencer)}
            contexto="Vencen en dos días o menos"
          />
          <TarjetaMetrica
            etiqueta="Vencidos"
            valor={String(contar("VENCIDOS"))}
            contexto={contar("VENCIDOS") === 0 ? "Todo dentro del plazo" : "Responder cuanto antes"}
          />
          <TarjetaMetrica
            etiqueta="Respondidos"
            valor={String(contar("RESPONDIDO"))}
            contexto={`${todos.length - quejas} reclamos · ${quejas} quejas`}
          />
        </RejillaMetricas>
      </Tarjeta>

      <ListaConLateral
        filasPorPagina={PAGINA}
        barra={
          <BarraLista
            juntos
            buscador={
              <Campo
                id="busqueda-reclamos"
                etiqueta="Buscar por número, nombre o correo"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Número, nombre o correo"
              />
            }
          >
            <Paginador pagina={pagina} paginas={paginas} onCambio={setPagina} />
            <CampoSelectorLista
              id="filtro-reclamos"
              ancho="amplio"
              etiqueta="Estado del reclamo"
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => {
                setFiltro(valor as FiltroReclamos);
                setPagina(1);
              }}
            />
            {filtro !== "PENDIENTE" || busqueda !== "" ? (
              <LimpiarFiltros
                onClick={() => {
                  setFiltro("PENDIENTE");
                  setBusqueda("");
                  setPagina(1);
                }}
              />
            ) : null}
          </BarraLista>
        }
        lateral={
          <VistaPrevia
            logo={null}
            estado={{ texto: "", tono: "neutro" }}
            etiqueta=""
            monto=""
            {...(seleccionado ? {} : { vacio: "Elige una hoja de la lista para ver su resumen." })}
          >
            {seleccionado ? (
              <CuadrosReclamo
                reclamoId={seleccionado.id}
                principal={{
                  etiqueta: seleccionado.estado === "PENDIENTE" ? "Responder" : "Ver hoja",
                  onClick: () => setAbierto(seleccionado.id),
                }}
              />
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {lista.isPending ? (
            <Cargando texto="Cargando reclamos…" />
          ) : lista.isError ? (
            <Alerta tono="error">{lista.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin reclamos"
              texto={
                busqueda
                  ? "Ninguna hoja coincide con esa búsqueda."
                  : "No hay hojas en este estado."
              }
            />
          ) : (
            <div>
              {visibles.map((r) => {
                const { dia, hora } = diaYHora(new Date(r.creadoEn));
                return (
                  <FilaPedido
                    key={r.id}
                    logo={<LogoIcono icono={<IconoLibro tamano={16} />} nombre="Hoja" />}
                    titulo={`${ETIQUETAS_TIPO_RECLAMO[r.tipo]} N.° ${r.codigo}`}
                    detalle={r.nombre}
                    contenido={r.descripcionBien}
                    centro={[dia, hora]}
                    estado={plazoCorto(r.estado, r.diasParaVencer)}
                    seleccionada={escritorio && seleccionado?.id === r.id}
                    onAbrir={() => (escritorio ? setElegido(r.id) : setAbierto(r.id))}
                    etiquetaAbrir={`${escritorio ? "Elegir" : "Ver"} hoja ${r.codigo}`}
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

/**
 * La hoja en cuadros: plazo, consumidor y lo reclamado. La usan la vista
 * previa y la cabecera del detalle.
 */
function CuadrosReclamo({ reclamoId, principal }: { reclamoId: string; principal: AccionBento }) {
  const trpc = useTRPC();
  const consulta = useQuery(trpc.panel.reclamos.detalle.queryOptions({ reclamoId }));

  if (consulta.isPending) return <Cargando texto="Cargando hoja…" />;
  if (consulta.isError) return <Alerta tono="error">{consulta.error.message}</Alerta>;

  const r = consulta.data;
  return (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoIcono icono={<IconoLibro tamano={16} />} nombre="Hoja" />}
        estado={plazo(r.estado, r.diasParaVencer, r.vence)}
        etiqueta={ETIQUETAS_TIPO_RECLAMO[r.tipo]}
        monto={`N.° ${r.codigo}`}
        texto
        detalle={FECHA_HORA.format(new Date(r.creadoEn))}
        acciones={[principal]}
      />
      <CuadroBento
        icono={<IconoUsuario tamano={16} />}
        titulo="Consumidor"
        ancho="ancho"
        detalle={r.email}
        cifras={[
          { valor: r.numeroDocumento, etiqueta: ETIQUETA_TIPO_DOCUMENTO[r.tipoDocumento] },
          { valor: r.telefono, etiqueta: "Teléfono" },
        ]}
      >
        {r.nombre}
        {r.menorDeEdad ? ` · apoderado ${r.apoderado}` : ""}
      </CuadroBento>
      <CuadroBento
        icono={<IconoCatalogo tamano={16} />}
        titulo={ETIQUETAS_TIPO_BIEN[r.tipoBien]}
        ancho="ancho"
        {...(r.pedidoCodigo || r.monto !== null
          ? {
              detalle: [
                r.pedidoCodigo ? `Pedido ${r.pedidoCodigo}` : null,
                r.monto !== null ? `Reclama ${MONEDA.format(r.monto)}` : null,
              ]
                .filter(Boolean)
                .join(" · "),
            }
          : {})}
      >
        {r.descripcionBien}
      </CuadroBento>
      <CuadroBento icono={<IconoMensaje tamano={16} />} titulo="Lo que pide" ancho="ancho">
        {r.pedido}
      </CuadroBento>
    </RejillaBento>
  );
}

function DetalleReclamo({ reclamoId, onVolver }: { reclamoId: string; onVolver: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const consulta = useQuery(trpc.panel.reclamos.detalle.queryOptions({ reclamoId }));
  const [respuesta, setRespuesta] = useState("");
  const [error, setError] = useState<string | null>(null);

  const responder = useMutation(
    trpc.panel.reclamos.responder.mutationOptions({
      onSuccess: () => {
        setError(null);
        setRespuesta("");
        void queryClient.invalidateQueries(trpc.panel.reclamos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.avisos.pathFilter());
      },
      onError: (fallo) => setError(fallo.message),
    }),
  );

  if (consulta.isPending) return <Cargando texto="Cargando hoja…" />;
  if (consulta.isError) {
    return (
      <Tarjeta
        acciones={
          <Boton variante="secundario" onClick={onVolver}>
            ← Volver a reclamos
          </Boton>
        }
      >
        <Alerta tono="error">{consulta.error.message}</Alerta>
      </Tarjeta>
    );
  }

  const r = consulta.data;

  return (
    <>
      {responder.isSuccess ? (
        <Alerta tono="exito">Respuesta guardada y enviada a {r.email}.</Alerta>
      ) : null}

      <CuadrosReclamo
        reclamoId={reclamoId}
        principal={{ etiqueta: "← Volver a reclamos", onClick: onVolver }}
      />

      <Tarjeta titulo="Detalle">
        <p>{r.detalle}</p>
      </Tarjeta>

      {r.estado === "RESPONDIDO" ? (
        <Tarjeta titulo="Respuesta">
          <p>{r.respuesta}</p>
          <p>
            {r.respondidoPor ?? "—"} ·{" "}
            {r.respondidoEn ? FECHA_HORA.format(new Date(r.respondidoEn)) : ""}
          </p>
        </Tarjeta>
      ) : (
        <Tarjeta titulo="Responder">
          <Formulario
            ancho="completo"
            onSubmit={(evento) => {
              evento.preventDefault();
              responder.mutate({ reclamoId: r.id, respuesta });
            }}
          >
            <p>
              Explica qué se hizo o qué se ofrece. La respuesta se envía a {r.email} y no se puede
              cambiar después.
            </p>
            <CampoTexto
              id="respuesta-reclamo"
              etiqueta="Respuesta al consumidor"
              valor={respuesta}
              onCambio={setRespuesta}
              error={error}
              filas={6}
              requerido
            />
            <Boton tipo="submit" disabled={responder.isPending || respuesta.trim() === ""}>
              {responder.isPending ? "Enviando…" : "Enviar respuesta"}
            </Boton>
          </Formulario>
        </Tarjeta>
      )}
    </>
  );
}
