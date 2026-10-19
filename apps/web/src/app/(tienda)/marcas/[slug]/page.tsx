/**
 * CLASE A — pagina de una marca: sus productos visibles. Destino de las
 * tarjetas del carrusel de marcas de la portada. El request del visitante no
 * toca la base: los datos salen de `marcaConProductos`, cacheada.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
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
  if (marca === null) return { title: "Marca no encontrada" };
  return {
    title: marca.nombre,
    description: `Productos de ${marca.nombre}: boxers, medias y básicos con envío a todo el Perú.`,
  };
}

export default async function PaginaMarca({ params }: Props) {
  const { slug } = await params;
  const marca = await marcaConProductos(slug);
  if (marca === null) notFound();

  return (
    <main>
      <Contenedor>
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
      </Contenedor>
    </main>
  );
}
