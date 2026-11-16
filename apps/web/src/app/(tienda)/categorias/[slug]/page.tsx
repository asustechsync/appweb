/**
 * CLASE A — listado de categoria. Etiqueta `categoria:{slug}`.
 *
 * La cabecera de la pagina (migas y titulo) se prerenderiza por categoria.
 * Los filtros viajan en la URL y solo el listado depende de ellos: va dentro
 * de <Suspense>, asi el resto sale estatico y el listado llega en el mismo
 * flujo. Cada combinacion de filtros es su propia entrada de cache bajo la
 * misma etiqueta: el visitante no toca la base. El panel de filtros son
 * enlaces: no hay estado de cliente que hidratar.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { filtrosDesdeUrl, hayFiltros, SIN_FILTROS, urlDeFiltros } from "@appweb/core";
import {
  BarraFiltros,
  BarraResultados,
  DisposicionListado,
  separarOrden,
  Cargando,
  Contenedor,
  EstadoVacio,
  Migas,
  RejillaProductos,
  TarjetaProducto,
} from "@appweb/ui";

import {
  type CategoriaDeListado,
  categoriaPorSlug,
  facetasDeCategoria,
  productosDeCategoria,
  slugsDeCategorias,
} from "@/lib/consultas";
import { gruposDeFiltros, resumenDeCantidad } from "@/lib/filtros";

type Parametros = Record<string, string | string[] | undefined>;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Parametros>;
}

export async function generateStaticParams() {
  const slugs = await slugsDeCategorias();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categoria = await categoriaPorSlug(slug);
  // El 404 sale dentro de <Suspense>, ya con estado 200: `noindex` lo saca de Google.
  if (categoria === null) return { title: "Categoría no encontrada", robots: { index: false } };

  // `tituloSeo` se escribe completo en el panel: va como `absolute` para no
  // repetir el sufijo de la plantilla (igual que en la ficha).
  const title = categoria.tituloSeo !== null ? { absolute: categoria.tituloSeo } : categoria.nombre;
  const description = categoria.descripcionSeo ?? categoria.descripcion;
  return description !== null ? { title, description } : { title };
}

/**
 * El `slug` se lee dentro de <Suspense>: con `partialPrefetching` el App Shell
 * se comparte entre todos los enlaces a la ruta y no puede depender de la URL.
 * Los datos salen de funciones cacheadas, asi que el contenido llega enseguida.
 */
export default function PaginaCategoria({ params, searchParams }: Props) {
  return (
    <main>
      <Contenedor>
        <Suspense fallback={<Cargando texto="Cargando categoría…" />}>
          <Contenido params={params} searchParams={searchParams} />
        </Suspense>
      </Contenedor>
    </main>
  );
}

async function Contenido({ params, searchParams }: Props) {
  const { slug } = await params;
  const categoria = await categoriaPorSlug(slug);
  if (categoria === null) notFound();

  return (
    <>
      <Migas
        tramos={[
          { nombre: "Inicio", href: "/" },
          ...(categoria.padre
            ? [
                {
                  nombre: categoria.padre.nombre,
                  href: `/categorias/${categoria.padre.slug}`,
                },
              ]
            : []),
          { nombre: categoria.nombre },
        ]}
      />
      <Suspense fallback={<Cargando texto="Cargando productos…" />}>
        <Listado categoria={categoria} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Listado({
  categoria,
  searchParams,
}: {
  categoria: CategoriaDeListado;
  searchParams: Promise<Parametros>;
}) {
  const base = `/categorias/${categoria.slug}`;
  const leidos = filtrosDesdeUrl(await searchParams);
  const facetas = await facetasDeCategoria(categoria.slug);
  // El filtro de tipo: las hijas en una categoria de tipo ("Medias" ->
  // Deportivas), los tipos con productos en una de publico ("Hombre" -> Medias).
  const subs = categoria.publico !== null ? facetas.tipos : categoria.hijas;
  // Una subcategoria que no esta en ese filtro se ignora: no se mezclan arboles.
  const filtros = subs.some((h) => h.slug === leidos.sub) ? leidos : { ...leidos, sub: null };

  const productos = await productosDeCategoria(categoria.slug, filtros);

  const { orden, filtros: grupos } = separarOrden(
    gruposDeFiltros(base, filtros, { hijas: subs, facetas }),
  );

  return (
    <DisposicionListado
      filtros={<BarraFiltros grupos={grupos} />}
      barra={
        <BarraResultados
          resumen={resumenDeCantidad(productos.length)}
          hrefLimpiar={
            hayFiltros(filtros) ? urlDeFiltros(base, SIN_FILTROS, { orden: filtros.orden }) : null
          }
          orden={orden}
        />
      }
    >
      {productos.length === 0 ? (
        <EstadoVacio
          titulo={hayFiltros(filtros) ? "Nada con estos filtros" : "Sin productos por ahora"}
          texto={
            hayFiltros(filtros)
              ? "Prueba quitando algún filtro."
              : "Pronto agregaremos productos a esta categoría."
          }
          textoAccion={hayFiltros(filtros) ? "Quitar filtros" : "Ver la portada"}
          hrefAccion={hayFiltros(filtros) ? base : "/"}
        />
      ) : (
        <RejillaProductos>
          {productos.map((producto) => (
            <TarjetaProducto key={producto.slug} {...producto} />
          ))}
        </RejillaProductos>
      )}
    </DisposicionListado>
  );
}
