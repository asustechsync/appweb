/**
 * CLASE A (variante) — busqueda.
 *
 * El termino es libre, asi que no se prerenderiza: el marco de la pagina sale
 * estatico y los resultados llegan dentro de <Suspense>. `buscarProductos` se
 * cachea por termino con vida corta; no vale la pena invalidarla por evento.
 * Los buscadores no la indexan (robots.ts).
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import {
  filtrosDesdeUrl,
  MIN_LETRAS_BUSQUEDA,
  ordenarPorPrecio,
  terminosDeBusqueda,
} from "@appweb/core";
import {
  BarraFiltros,
  BarraResultados,
  DisposicionListado,
  separarOrden,
  CabeceraSeccion,
  Cargando,
  Contenedor,
  EstadoVacio,
  RejillaProductos,
  TarjetaProducto,
} from "@appweb/ui";

import { buscarProductos } from "@/lib/consultas";
import { gruposDeFiltros, resumenDeCantidad } from "@/lib/filtros";

type Parametros = Record<string, string | string[] | undefined>;

export const metadata: Metadata = { title: "Buscar", robots: { index: false } };

export default function PaginaBuscar({ searchParams }: { searchParams: Promise<Parametros> }) {
  return (
    <main>
      <Contenedor>
        <Suspense fallback={<Cargando texto="Buscando…" />}>
          <Resultados searchParams={searchParams} />
        </Suspense>
      </Contenedor>
    </main>
  );
}

async function Resultados({ searchParams }: { searchParams: Promise<Parametros> }) {
  const parametros = await searchParams;
  const crudo = parametros["q"];
  const q = (Array.isArray(crudo) ? crudo[0] : crudo)?.trim() ?? "";
  const terminos = terminosDeBusqueda(q);

  if (terminos.length === 0) {
    return (
      <>
        <CabeceraSeccion titulo="Buscar" />
        <EstadoVacio
          titulo="¿Qué estás buscando?"
          texto={`Escribe al menos ${MIN_LETRAS_BUSQUEDA} letras en el buscador: por ejemplo "boxer" o "medias".`}
          textoAccion="Ver la portada"
          hrefAccion="/"
        />
      </>
    );
  }

  const filtros = filtrosDesdeUrl(parametros);
  const base = `/buscar?q=${encodeURIComponent(q)}`;
  const productos = ordenarPorPrecio(await buscarProductos(terminos), filtros.orden);

  const { orden: ordenDeListado, filtros: filtrosDeListado } = separarOrden(
    gruposDeFiltros(base, filtros, {}),
  );

  return (
    <>
      <CabeceraSeccion titulo={`Resultados para “${q}”`} />
      {productos.length === 0 ? (
        <EstadoVacio
          titulo="No encontramos productos"
          texto="Revisa cómo está escrito o prueba con una palabra más general, como “boxer” o “medias”."
          textoAccion="Ver la portada"
          hrefAccion="/"
        />
      ) : (
        <DisposicionListado
          filtros={<BarraFiltros grupos={filtrosDeListado} />}
          barra={
            <BarraResultados resumen={resumenDeCantidad(productos.length)} orden={ordenDeListado} />
          }
        >
          <RejillaProductos>
            {productos.map((producto) => (
              <TarjetaProducto key={producto.slug} {...producto} />
            ))}
          </RejillaProductos>
        </DisposicionListado>
      )}
    </>
  );
}
