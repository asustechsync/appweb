"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS_ESTADO_RESENA, type DecisionResena, type EstadoResena } from "@appweb/core";
import {
  Alerta,
  BarraLista,
  Campo,
  CampoSelectorLista,
  Cargando,
  CuadroBento,
  CuadroMonto,
  EstadoVacio,
  Estrellas,
  FilaPedido,
  IconoBuscar,
  IconoEstrella,
  IconoMensaje,
  IconoUsuario,
  LimpiarFiltros,
  ListaConLateral,
  LogoFoto,
  Paginador,
  RejillaBento,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
  type AccionBento,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useEscritorio } from "@/lib/use-escritorio";
import { usePaginado } from "@/lib/use-paginado";
import { useTRPC } from "@/lib/trpc";
import { urlVisible } from "@/lib/url-visible";

import { CALIFICACION, FECHA_HORA, diaYHora } from "@appweb/core/formato";

type FiltroResenas = EstadoResena | "TODAS";

const FILTROS: { id: FiltroResenas; etiqueta: string }[] = [
  { id: "PENDIENTE", etiqueta: "Por revisar" },
  { id: "APROBADA", etiqueta: "Publicadas" },
  { id: "RECHAZADA", etiqueta: "No publicadas" },
  { id: "TODAS", etiqueta: "Todas" },
];

function tonoDeEstado(estado: EstadoResena): "exito" | "alerta" | "error" {
  if (estado === "APROBADA") return "exito";
  if (estado === "PENDIENTE") return "alerta";
  return "error";
}

/** Cuantas reseñas se ven por pagina. */
const PAGINA = 10;

/**
 * Reseñas: la cola de lo que escribieron los clientes. Nada sale en la tienda
 * sin pasar por aqui. Publicar o retirar una reseña regenera la ficha y los
 * listados de ese producto.
 */
export function Resenas() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<FiltroResenas>("PENDIENTE");
  const [busqueda, setBusqueda] = useState("");
  const [aviso, setAviso] = useState<{ tono: "exito" | "info" | "error"; texto: string } | null>(
    null,
  );

  // Se traen todas y se filtra aqui: las cifras de arriba no dependen del filtro.
  const lista = useQuery(trpc.panel.resenas.listar.queryOptions({}));
  const todas = lista.data?.resenas ?? [];

  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data?.resenas ?? []).filter(
      (r) =>
        (filtro === "TODAS" || r.estado === filtro) &&
        (termino === "" ||
          r.producto.toLowerCase().includes(termino) ||
          r.autor.toLowerCase().includes(termino) ||
          (r.comentario ?? "").toLowerCase().includes(termino)),
    );
  }, [busqueda, filtro, lista.data]);
  const { pagina, paginas, setPagina, visibles } = usePaginado(coinciden, PAGINA);

  const escritorio = useEscritorio();
  const [elegida, setElegida] = useState<string | null>(null);
  const seleccionada = visibles.find((r) => r.id === elegida) ?? visibles[0] ?? null;
  // En movil no hay vista previa: tocar una fila la abre sola, en lugar de la lista.
  const [abiertaMovil, setAbiertaMovil] = useState<string | null>(null);

  const moderar = useMutation(
    trpc.panel.resenas.moderar.mutationOptions({
      onSuccess: async (r, entrada) => {
        void queryClient.invalidateQueries(trpc.panel.resenas.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.avisos.pathFilter());
        const tiendaAlDia = await revalidarTienda(r.revalidar);
        const hecho = entrada.estado === "APROBADA" ? "Reseña publicada." : "Reseña retirada.";
        setAviso(
          tiendaAlDia
            ? { tono: "exito", texto: hecho }
            : {
                tono: "info",
                texto: `${hecho} La tienda tardará unos minutos en mostrar el cambio.`,
              },
        );
      },
      onError: (fallo) => setAviso({ tono: "error", texto: fallo.message }),
    }),
  );

  function decidir(resenaId: string, estado: DecisionResena) {
    setAviso(null);
    moderar.mutate({ resenaId, estado });
  }

  /** Publicar, retirar o no publicar: lo que tenga sentido segun el estado. */
  function accionesDe(r: { id: string; estado: EstadoResena }): AccionBento[] {
    if (moderar.isPending) return [];
    const acciones: AccionBento[] = [];
    if (r.estado !== "APROBADA") {
      acciones.push({ etiqueta: "Publicar", onClick: () => decidir(r.id, "APROBADA") });
    }
    if (r.estado !== "RECHAZADA") {
      acciones.push({
        etiqueta: r.estado === "APROBADA" ? "Retirar" : "No publicar",
        onClick: () => decidir(r.id, "RECHAZADA"),
      });
    }
    return acciones;
  }

  const conteo = lista.data?.porEstado;
  const opciones = FILTROS.map((f) => {
    const cantidad = conteo && f.id !== "TODAS" ? conteo[f.id] : 0;
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });
  const publicadas = todas.filter((r) => r.estado === "APROBADA");
  const promedio =
    publicadas.length === 0
      ? null
      : publicadas.reduce((suma, r) => suma + r.estrellas, 0) / publicadas.length;
  const bajas = todas.filter((r) => r.estado === "PENDIENTE" && r.estrellas <= 2).length;

  const movil = abiertaMovil ? todas.find((r) => r.id === abiertaMovil) : undefined;
  if (!escritorio && movil) {
    return (
      <>
        {aviso ? <Alerta tono={aviso.tono}>{aviso.texto}</Alerta> : null}
        <CuadrosResena
          resena={movil}
          acciones={[
            { etiqueta: "← Volver", onClick: () => setAbiertaMovil(null) },
            ...accionesDe(movil),
          ]}
        />
      </>
    );
  }

  return (
    <>
      {aviso ? <Alerta tono={aviso.tono}>{aviso.texto}</Alerta> : null}

      <Tarjeta titulo="Reseñas" sinMarco>
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="Por revisar"
            valor={String(conteo?.PENDIENTE ?? 0)}
            contexto={
              bajas > 0 ? `${bajas} con 2 estrellas o menos` : "Nada sale sin pasar por aquí"
            }
          />
          <TarjetaMetrica
            etiqueta="Publicadas"
            valor={String(conteo?.APROBADA ?? 0)}
            contexto="Se ven en la ficha del producto"
          />
          <TarjetaMetrica
            etiqueta="Calificación media"
            valor={promedio === null ? "—" : CALIFICACION.format(promedio)}
            contexto="De las publicadas, sobre 5"
          />
          <TarjetaMetrica
            etiqueta="No publicadas"
            valor={String(conteo?.RECHAZADA ?? 0)}
            contexto="Retiradas o rechazadas"
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
                id="busqueda-resenas"
                etiqueta="Buscar por producto, autor o comentario"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Producto, autor o texto"
              />
            }
          >
            <Paginador pagina={pagina} paginas={paginas} onCambio={setPagina} />
            <CampoSelectorLista
              id="filtro-resenas"
              ancho="amplio"
              etiqueta="Estado de la reseña"
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => {
                setFiltro(valor as FiltroResenas);
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
            {...(seleccionada ? {} : { vacio: "Elige una reseña de la lista para revisarla." })}
          >
            {seleccionada ? (
              <CuadrosResena resena={seleccionada} acciones={accionesDe(seleccionada)} />
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {lista.isPending ? (
            <Cargando texto="Cargando reseñas…" />
          ) : lista.isError ? (
            <Alerta tono="error">{lista.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin reseñas"
              texto={
                busqueda
                  ? "Ninguna reseña coincide con esa búsqueda."
                  : "No hay reseñas en este estado."
              }
            />
          ) : (
            <div>
              {visibles.map((r) => {
                const { dia, hora } = diaYHora(new Date(r.creadoEn));
                return (
                  <FilaPedido
                    key={r.id}
                    logo={<LogoFoto src={urlVisible(r.imagen)} nombre={r.producto} />}
                    titulo={r.producto}
                    detalle={r.autor}
                    contenido={r.comentario ?? "Sin comentario, solo estrellas."}
                    centro={[dia, hora]}
                    estado={{
                      texto: ETIQUETAS_ESTADO_RESENA[r.estado],
                      tono: tonoDeEstado(r.estado),
                    }}
                    nota={`${r.estrellas} de 5 estrellas`}
                    seleccionada={escritorio && seleccionada?.id === r.id}
                    onAbrir={() => (escritorio ? setElegida(r.id) : setAbiertaMovil(r.id))}
                    etiquetaAbrir={`${escritorio ? "Elegir" : "Ver"} reseña de ${r.autor} sobre ${r.producto}`}
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

interface ResenaDeLista {
  estrellas: number;
  comentario: string | null;
  estado: EstadoResena;
  creadoEn: string;
  producto: string;
  imagen: string | null;
  autor: string;
  email: string;
  moderadoPor: string | null;
  moderadoEn: string | null;
}

/** La reseña en cuadros: estrellas, texto, autor y quien la modero. */
function CuadrosResena({
  resena: r,
  acciones,
}: {
  resena: ResenaDeLista;
  acciones: AccionBento[];
}) {
  return (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoFoto src={urlVisible(r.imagen)} nombre={r.producto} />}
        estado={{ texto: ETIQUETAS_ESTADO_RESENA[r.estado], tono: tonoDeEstado(r.estado) }}
        etiqueta={r.producto}
        monto={`${r.estrellas} de 5`}
        texto
        detalle={FECHA_HORA.format(new Date(r.creadoEn))}
        acciones={acciones}
      />
      <CuadroBento icono={<IconoEstrella tamano={16} />} titulo="Calificación" ancho="ancho">
        <Estrellas valor={r.estrellas} tamano={16} />
      </CuadroBento>
      <CuadroBento
        icono={<IconoMensaje tamano={16} />}
        titulo="Comentario"
        ancho="ancho"
        vacio={!r.comentario}
      >
        {r.comentario ?? "Sin comentario, solo estrellas."}
      </CuadroBento>
      <CuadroBento
        icono={<IconoUsuario tamano={16} />}
        titulo="Autor"
        ancho="ancho"
        detalle={
          r.moderadoPor && r.moderadoEn
            ? `Moderada por ${r.moderadoPor}, ${FECHA_HORA.format(new Date(r.moderadoEn))}`
            : r.email
        }
      >
        {r.autor}
      </CuadroBento>
    </RejillaBento>
  );
}
