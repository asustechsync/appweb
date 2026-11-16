/**
 * CLASE A — pagina de una marca: sus productos visibles. Destino de las
 * tarjetas del carrusel de marcas de la portada. El request del visitante no
 * toca la base: los datos salen de `marcaConProductos`, cacheada.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  Cargando,
  CabeceraSeccion,
  Contenedor,
  EstadoVacio,
  Migas,
  RejillaProductos,
  TarjetaProducto,
} from "@appweb/ui";

import { marcaConProductos, slugsDeMarcas } from "@/lib/consultas";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await slugsDeMarcas();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const marca = await marcaConProductos(slug);
  // El 404 sale dentro de <Suspense>, ya con estado 200: `noindex` lo saca de Google.
  if (marca === null) return { title: "Marca no encontrada", robots: { index: false } };
  return {
    title: marca.nombre,
    description: `Productos de ${marca.nombre}: boxers, medias y básicos con envío a todo el Perú.`,
  };
}

/**
 * El `slug` se lee dentro de <Suspense>: con `partialPrefetching` el App Shell
 * se comparte entre todos los enlaces a la ruta y no puede depender de la URL.
 */
export default function PaginaMarca({ params }: Props) {
  return (
    <main>
      <Contenedor>
        <Suspense fallback={<Cargando texto="Cargando marca…" />}>
          <Contenido params={params} />
        </Suspense>
      </Contenedor>
    </main>
  );
}

async function Contenido({ params }: Props) {
  const { slug } = await params;
  const marca = await marcaConProductos(slug);
  if (marca === null) notFound();

  return (
    <>
      <Migas
        tramos={[
          { nombre: "Inicio", href: "/" },
          { nombre: "Marcas", href: "/#marcas" },
          { nombre: marca.nombre },
        ]}
      />
      <CabeceraSeccion titulo={marca.nombre} />
      {marca.productos.length === 0 ? (
        <EstadoVacio
          titulo="Sin productos por ahora"
          texto="Esta marca no tiene productos disponibles en este momento."
          textoAccion="Ver la portada"
          hrefAccion="/"
        />
      ) : (
        <RejillaProductos>
          {marca.productos.map((producto) => (
            <TarjetaProducto key={producto.slug} {...producto} />
          ))}
        </RejillaProductos>
      )}
    </>
  );
}
