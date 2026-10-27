"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS_MOVIMIENTO, type TipoMovimientoManual } from "@appweb/core";
import {
  Alerta,
  BarraLista,
  CabeceraDetalle,
  Boton,
  Campo,
  CampoSelectorLista,
  Cargando,
  EstadoVacio,
  FilaMovimiento,
  FilaPedido,
  Formulario,
  IconoBuscar,
  IconoFlechaIzquierda,
  IconoReloj,
  LimpiarFiltros,
  ListaConLateral,
  LogoFoto,
  LogoIcono,
  Paginador,
  Pestanas,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";
import { urlVisible } from "@/lib/url-visible";

import { CuadrosStock, estadoDeStock, type VarianteDeStock } from "./CuadrosStock";
import { conSigno, diaYHora } from "@appweb/core/formato";

type Filtro = "BAJO" | "AGOTADAS" | "TODAS";

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "BAJO", etiqueta: "Por reponer" },
  { id: "AGOTADAS", etiqueta: "Agotadas" },
  { id: "TODAS", etiqueta: "Todas las variantes" },
];

/** Por reponer y agotadas solo cuentan lo que esta a la venta. */
function cumpleFiltro(v: { stock: number; activa: boolean }, filtro: Filtro, umbral: number) {
  if (filtro === "BAJO") return v.activa && v.stock <= umbral;
  if (filtro === "AGOTADAS") return v.activa && v.stock === 0;
  return true;
}

/** Cuantas variantes se ven por pagina. */
const PAGINA = 10;

/**
 * Seccion de inventario: cuanto queda de cada talla y color, con vista previa
 * al lado (escritorio), y los tres movimientos que se registran a mano
 * (ingreso, ajuste por conteo, merma). Las ventas y devoluciones no se
 * registran aqui: las deja el pedido.
 */
export function Inventario() {
  const trpc = useTRPC();
  const [filtro, setFiltro] = useState<Filtro>("BAJO");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierta, setAbierta] = useState<VarianteDeStock | null>(null);

  const lista = useQuery(trpc.panel.stock.listar.queryOptions());
  const umbral = lista.data?.umbralBajo ?? 0;
  const variantes = lista.data?.variantes ?? [];

  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data?.variantes ?? []).filter(
      (v) =>
        cumpleFiltro(v, filtro, umbral) &&
        (termino === "" ||
          v.producto.toLowerCase().includes(termino) ||
          v.sku.toLowerCase().includes(termino) ||
          v.color.toLowerCase().includes(termino)),
    );
  }, [busqueda, filtro, lista.data, umbral]);
  const paginas = Math.max(1, Math.ceil(coinciden.length / PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = useMemo(
    () => coinciden.slice((paginaActual - 1) * PAGINA, paginaActual * PAGINA),
    [coinciden, paginaActual],
  );

  const escritorio = useEscritorio();
  const [elegida, setElegida] = useState<string | null>(null);
  const seleccionada = visibles.find((v) => v.id === elegida) ?? visibles[0] ?? null;

  if (abierta !== null) {
    // Datos frescos de la lista si ya cambiaron (tras registrar un movimiento).
    const actual = variantes.find((v) => v.id === abierta.id) ?? abierta;
    return (
      <MovimientosVariante variante={actual} umbral={umbral} onVolver={() => setAbierta(null)} />
    );
  }

  const conteo = (id: Filtro) => variantes.filter((v) => cumpleFiltro(v, id, umbral)).length;
  const opciones = FILTROS.map((f) => {
    const cantidad = f.id === "TODAS" ? 0 : conteo(f.id);
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });
  const aLaVenta = variantes.filter((v) => v.activa);
  const unidades = aLaVenta.reduce((suma, v) => suma + v.stock, 0);
  const porReponer = conteo("BAJO");
  const agotadas = conteo("AGOTADAS");

  return (
    <>
      <Tarjeta titulo="Inventario" sinMarco>
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="Unidades a la venta"
            valor={String(unidades)}
            contexto={`En ${aLaVenta.length} ${aLaVenta.length === 1 ? "variante" : "variantes"}`}
          />
          <TarjetaMetrica
            etiqueta="Por reponer"
            valor={String(porReponer)}
            contexto={`Con ${umbral} unidades o menos`}
          />
          <TarjetaMetrica
            etiqueta="Agotadas"
            valor={String(agotadas)}
            contexto={agotadas === 0 ? "Nada agotado" : "Visibles sin stock"}
          />
          <TarjetaMetrica
            etiqueta="Fuera de venta"
            valor={String(variantes.length - aLaVenta.length)}
            contexto="Variantes o productos ocultos"
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
                id="busqueda-stock"
                etiqueta="Buscar por producto, color o SKU"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Producto, color o SKU"
              />
            }
          >
            <Paginador pagina={paginaActual} paginas={paginas} onCambio={setPagina} />
            <CampoSelectorLista
              id="filtro-stock"
              ancho="amplio"
              etiqueta="Qué variantes mostrar"
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => {
                setFiltro(valor as Filtro);
                setPagina(1);
              }}
            />
            {filtro !== "BAJO" || busqueda !== "" ? (
              <LimpiarFiltros
                onClick={() => {
                  setFiltro("BAJO");
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
            {...(seleccionada
              ? {}
              : { vacio: "Elige una variante de la lista para ver su stock." })}
          >
            {seleccionada ? (
              <CuadrosStock
                variante={seleccionada}
                umbral={umbral}
                onMover={() => setAbierta(seleccionada)}
              />
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {lista.isPending ? (
            <Cargando texto="Cargando stock…" />
          ) : lista.isError ? (
            <Alerta tono="error">{lista.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo={filtro === "BAJO" && !busqueda ? "Nada por reponer" : "Sin resultados"}
              texto={
                filtro === "BAJO" && !busqueda
                  ? `Todas las variantes en venta tienen más de ${umbral} unidades.`
                  : "Ninguna variante coincide con esa búsqueda."
              }
            />
          ) : (
            <div>
              {visibles.map((v) => (
                <FilaPedido
                  key={v.id}
                  logo={<LogoFoto src={urlVisible(v.imagen)} nombre={v.producto} />}
                  titulo={v.producto}
                  detalle={`${v.talla} · ${v.color}`}
                  contenido={`SKU ${v.sku}`}
                  centro={[`${v.stock} u.`, "En stock"]}
                  estado={estadoDeStock(v, umbral)}
                  seleccionada={escritorio && seleccionada?.id === v.id}
                  onAbrir={() => (escritorio ? setElegida(v.id) : setAbierta(v))}
                  etiquetaAbrir={`${escritorio ? "Elegir" : "Mover stock de"} ${v.producto} ${v.talla} ${v.color}`}
                />
              ))}
            </div>
          )}
        </Tarjeta>
      </ListaConLateral>
    </>
  );
}

// ── Movimientos de una variante ─────────────────────────────────────────────

/** Que se pide en cada tipo de movimiento. */
const FORMULARIO: Record<
  TipoMovimientoManual,
  { cantidad: string; nota: string; boton: string; ayuda: string }
> = {
  INGRESO: {
    cantidad: "Unidades que entran",
    nota: "Nota (opcional): proveedor, guía…",
    boton: "Registrar ingreso",
    ayuda: "Mercadería nueva que llega al almacén.",
  },
  AJUSTE: {
    cantidad: "Unidades contadas en el almacén",
    nota: "Motivo del ajuste (obligatorio)",
    boton: "Ajustar al conteo",
    ayuda: "Escribe lo que contaste: el sistema registra la diferencia.",
  },
  MERMA: {
    cantidad: "Unidades dañadas o perdidas",
    nota: "Qué pasó (obligatorio)",
    boton: "Dar de baja",
    ayuda: "Prendas que ya no se pueden vender.",
  },
};

interface PropsMovimientosVariante {
  variante: VarianteDeStock;
  umbral: number;
  onVolver: () => void;
}

function MovimientosVariante({ variante, umbral, onVolver }: PropsMovimientosVariante) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const historial = useQuery(trpc.panel.stock.historial.queryOptions({ varianteId: variante.id }));

  const [tipo, setTipo] = useState<TipoMovimientoManual>("INGRESO");
  const [cantidad, setCantidad] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const registrar = useMutation(
    trpc.panel.stock.registrar.mutationOptions({
      onSuccess: async (r) => {
        setError(null);
        setCantidad("");
        setNota("");
        const tiendaAlDia = await revalidarTienda(r.revalidar);
        setAviso(
          `Listo: ahora hay ${r.stockNuevo} en stock.` +
            (tiendaAlDia ? "" : " La tienda tardará unos minutos en mostrarlo."),
        );
        void queryClient.invalidateQueries(trpc.panel.stock.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.productos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.resumen.pathFilter());
      },
      onError: (fallo) => {
        setAviso(null);
        setError(fallo.message);
      },
    }),
  );

  const textos = FORMULARIO[tipo];

  return (
    <>
      <CabeceraDetalle
        titulo={`${variante.producto} · ${variante.talla} · ${variante.color}`}
        acciones={
          <Boton variante="secundario" onClick={onVolver}>
            <IconoFlechaIzquierda tamano={16} />
            Volver a inventario
          </Boton>
        }
      />
      <CuadrosStock variante={variante} umbral={umbral} />

      <Tarjeta titulo="Registrar movimiento">
        {error ? <Alerta tono="error">{error}</Alerta> : null}
        {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
        <Pestanas
          etiqueta="Tipo de movimiento"
          opciones={[
            { id: "INGRESO", etiqueta: "Ingreso" },
            { id: "AJUSTE", etiqueta: "Ajuste por conteo" },
            { id: "MERMA", etiqueta: "Merma" },
          ]}
          activa={tipo}
          onCambio={(id) => {
            setTipo(id as TipoMovimientoManual);
            setError(null);
          }}
        />
        <Formulario
          onSubmit={(evento) => {
            evento.preventDefault();
            registrar.mutate({
              varianteId: variante.id,
              tipo,
              cantidad: cantidad.trim() === "" ? Number.NaN : Number(cantidad),
              ...(nota.trim() === "" ? {} : { nota }),
            });
          }}
        >
          <p>{textos.ayuda}</p>
          <Campo
            id="movimiento-cantidad"
            etiqueta={textos.cantidad}
            valor={cantidad}
            onCambio={setCantidad}
            requerido
          />
          <Campo
            id="movimiento-nota"
            etiqueta={textos.nota}
            valor={nota}
            onCambio={setNota}
            requerido={tipo !== "INGRESO"}
          />
          <Boton tipo="submit" disabled={registrar.isPending || cantidad.trim() === ""}>
            {registrar.isPending ? "Guardando…" : textos.boton}
          </Boton>
        </Formulario>
      </Tarjeta>

      <Tarjeta titulo="Historial">
        {historial.isPending ? (
          <Cargando texto="Cargando historial…" />
        ) : historial.isError ? (
          <Alerta tono="error">{historial.error.message}</Alerta>
        ) : historial.data.length === 0 ? (
          <EstadoVacio titulo="Sin movimientos" texto="Esta variante todavía no tiene historial." />
        ) : (
          <div>
            {historial.data.map((m) => {
              const { dia, hora } = diaYHora(new Date(m.creadoEn));
              const quien = m.usuario ?? "Sistema";
              return (
                <FilaMovimiento
                  key={m.id}
                  logo={<LogoIcono icono={<IconoReloj tamano={16} />} nombre="Movimiento" />}
                  titulo={ETIQUETAS_MOVIMIENTO[m.motivo]}
                  {...(m.pedido ? { detalle: `pedido ${m.pedido}` } : {})}
                  subtitulo={m.nota ? `${quien} · ${m.nota}` : quien}
                  estado={{
                    texto: m.delta > 0 ? "Entra" : "Sale",
                    tono: m.delta > 0 ? "exito" : "alerta",
                  }}
                  valor={`${conSigno(m.delta)} u.`}
                  centro={[dia, hora]}
                />
              );
            })}
          </div>
        )}
      </Tarjeta>
    </>
  );
}
