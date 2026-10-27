"use client";

import { useEffect, useMemo, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Alerta,
  BarraLista,
  Boton,
  Campo,
  CampoSelectorLista,
  Cargando,
  EstadoVacio,
  FilaPedido,
  IconoBuscar,
  LimpiarFiltros,
  ListaConLateral,
  LogoFoto,
  Paginador,
  RejillaMetricas,
  Tarjeta,
  TarjetaMetrica,
  VistaPrevia,
} from "@appweb/ui";

import { useEscritorio } from "@/lib/use-escritorio";
import { useTRPC } from "@/lib/trpc";
import { urlVisible } from "@/lib/url-visible";

import { CuadrosProducto, estadoDeProducto } from "./CuadrosProducto";
import { EditorProducto } from "./EditorProducto";
import { MONEDA } from "@appweb/core/formato";

type Filtro = "TODOS" | "VISIBLES" | "OCULTOS" | "SIN_STOCK";

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "TODOS", etiqueta: "Todos los productos" },
  { id: "VISIBLES", etiqueta: "En la tienda" },
  { id: "OCULTOS", etiqueta: "Ocultos" },
  { id: "SIN_STOCK", etiqueta: "Sin stock" },
];

function cumpleFiltro(p: { activo: boolean; stockTotal: number }, filtro: Filtro): boolean {
  if (filtro === "VISIBLES") return p.activo;
  if (filtro === "OCULTOS") return !p.activo;
  if (filtro === "SIN_STOCK") return p.stockTotal === 0;
  return true;
}

/** "nuevo" abre el formulario vacio; un id abre ese producto. */
type Abierto = null | "nuevo" | string;

/** Cuantos productos se ven por pagina. */
const PAGINA = 10;

/**
 * Seccion de productos: el catalogo completo con vista previa al lado
 * (escritorio) y, al abrir uno, su editor.
 *
 * Que es un precio valido, como se arma el SKU o si una variante esta
 * repetida lo deciden @appweb/core y @appweb/api; aqui solo se muestra y se
 * envia.
 */
export function Productos() {
  const trpc = useTRPC();
  const [abierto, setAbierto] = useState<Abierto>(null);
  // El editor se vuelve a montar al pasar de "nuevo" al id creado: el aviso
  // de exito se recuerda aqui para no perderlo en ese cambio.
  const [recienCreado, setRecienCreado] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const lista = useQuery(trpc.panel.productos.listar.queryOptions());
  const productos = lista.data ?? [];

  const coinciden = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data ?? []).filter(
      (p) =>
        cumpleFiltro(p, filtro) &&
        (termino === "" ||
          p.nombre.toLowerCase().includes(termino) ||
          p.slug.includes(termino) ||
          (p.marca ?? "").toLowerCase().includes(termino)),
    );
  }, [busqueda, filtro, lista.data]);
  const paginas = Math.max(1, Math.ceil(coinciden.length / PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = useMemo(
    () => coinciden.slice((paginaActual - 1) * PAGINA, paginaActual * PAGINA),
    [coinciden, paginaActual],
  );

  const escritorio = useEscritorio();
  const [elegido, setElegido] = useState<string | null>(null);
  const seleccionado = visibles.find((p) => p.id === elegido) ?? visibles[0] ?? null;

  // Precarga el detalle de los que se ven: al elegir uno, ya esta en cache.
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!escritorio) return;
    for (const producto of visibles) {
      void queryClient.prefetchQuery(
        trpc.panel.productos.detalle.queryOptions({ productoId: producto.id }),
      );
    }
  }, [escritorio, visibles, queryClient, trpc]);

  if (abierto !== null) {
    return (
      <EditorProducto
        productoId={abierto === "nuevo" ? null : abierto}
        recienCreado={abierto !== "nuevo" && abierto === recienCreado}
        onCreado={(id) => {
          setRecienCreado(id);
          setAbierto(id);
        }}
        onVolver={() => setAbierto(null)}
      />
    );
  }

  const conteo = (id: Filtro) => productos.filter((p) => cumpleFiltro(p, id)).length;
  const opciones = FILTROS.map((f) => {
    const cantidad = f.id === "TODOS" ? 0 : conteo(f.id);
    return { valor: f.id, etiqueta: cantidad > 0 ? `${f.etiqueta} (${cantidad})` : f.etiqueta };
  });
  const enTienda = conteo("VISIBLES");
  const sinStock = productos.filter((p) => p.activo && p.stockTotal === 0).length;
  const unidades = productos.reduce((suma, p) => suma + p.stockTotal, 0);
  const enOferta = productos.filter((p) => p.precioLista !== null).length;

  return (
    <>
      <Tarjeta
        titulo="Productos"
        sinMarco
        acciones={<Boton onClick={() => setAbierto("nuevo")}>+ Nuevo producto</Boton>}
      >
        <RejillaMetricas>
          <TarjetaMetrica
            etiqueta="En la tienda"
            valor={String(enTienda)}
            contexto={`De ${productos.length} en el catálogo`}
          />
          <TarjetaMetrica
            etiqueta="Ocultos"
            valor={String(productos.length - enTienda)}
            contexto="No se ven en la tienda"
          />
          <TarjetaMetrica
            etiqueta="Sin stock"
            valor={String(sinStock)}
            contexto={sinStock === 0 ? "Todo lo visible tiene stock" : "Visibles pero agotados"}
          />
          <TarjetaMetrica
            etiqueta="Unidades"
            valor={String(unidades)}
            contexto={`${enOferta} ${enOferta === 1 ? "producto rebajado" : "productos rebajados"}`}
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
                id="busqueda-productos"
                etiqueta="Buscar por nombre, marca o dirección web"
                etiquetaOculta
                icono={<IconoBuscar tamano={16} />}
                valor={busqueda}
                onCambio={(valor) => {
                  setBusqueda(valor);
                  setPagina(1);
                }}
                placeholder="Nombre, marca o dirección"
              />
            }
          >
            <Paginador pagina={paginaActual} paginas={paginas} onCambio={setPagina} />
            <CampoSelectorLista
              id="filtro-productos"
              ancho="amplio"
              etiqueta="Visibilidad"
              etiquetaOculta
              valor={filtro}
              opciones={opciones}
              onCambio={(valor) => {
                setFiltro(valor as Filtro);
                setPagina(1);
              }}
            />
            {filtro !== "TODOS" || busqueda !== "" ? (
              <LimpiarFiltros
                onClick={() => {
                  setFiltro("TODOS");
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
            {...(seleccionado
              ? {}
              : { vacio: "Elige un producto de la lista para ver su resumen." })}
          >
            {seleccionado ? (
              <CuadrosProducto
                producto={seleccionado}
                onEditar={() => setAbierto(seleccionado.id)}
              />
            ) : null}
          </VistaPrevia>
        }
      >
        <Tarjeta>
          {lista.isPending ? (
            <Cargando texto="Cargando productos…" />
          ) : lista.isError ? (
            <Alerta tono="error">{lista.error.message}</Alerta>
          ) : visibles.length === 0 ? (
            <EstadoVacio
              titulo="Sin productos"
              texto={
                busqueda ? "Ningún producto coincide con esa búsqueda." : "No hay productos aquí."
              }
            />
          ) : (
            <div>
              {visibles.map((p) => (
                <FilaPedido
                  key={p.id}
                  logo={<LogoFoto src={urlVisible(p.imagen)} nombre={p.nombre} />}
                  titulo={p.nombre}
                  {...(p.destacado ? { detalle: "Destacado" } : {})}
                  contenido={`${p.categoria}${p.marca ? ` · ${p.marca}` : ""}`}
                  centro={[
                    MONEDA.format(p.precio),
                    p.precioLista !== null ? `Antes ${MONEDA.format(p.precioLista)}` : "Precio",
                  ]}
                  estado={estadoDeProducto(p)}
                  nota={`${p.stockTotal} u. · ${p.variantes} ${p.variantes === 1 ? "variante" : "variantes"}`}
                  seleccionada={escritorio && seleccionado?.id === p.id}
                  onAbrir={() => (escritorio ? setElegido(p.id) : setAbierto(p.id))}
                  etiquetaAbrir={`${escritorio ? "Elegir" : "Editar"} ${p.nombre}`}
                />
              ))}
            </div>
          )}
        </Tarjeta>
      </ListaConLateral>
    </>
  );
}
