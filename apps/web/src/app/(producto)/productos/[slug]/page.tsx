/**
 * CLASE A — ficha de producto. Etiqueta `producto:{slug}`.
 *
 * Todo el marcado es estatico salvo la galeria y el selector de variantes,
 * que son islas cliente y se hidratan sin bloquear el resto. El request del
 * visitante no toca la base: los datos salen de `productoPorSlug`, cacheada.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { URL_TIENDA } from "@appweb/api/urls";
import { Contenedor, ListaResenas, Migas } from "@appweb/ui";

import { type ProductoDeFicha, productoPorSlug, slugsDeProductos } from "@/lib/consultas";

import { FichaProductoCliente } from "./FichaProductoCliente";
import { SeccionesFicha } from "./secciones-ficha";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await slugsDeProductos();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const producto = await productoPorSlug(slug);

  if (producto === null) return { title: "Producto no encontrado" };

  const descripcion = producto.descripcionSeo ?? producto.descripcionCorta;

  // `tituloSeo` se escribe completo en el panel ("... | Tienda"), asi que va
  // como `absolute`: pasarlo por la plantilla del layout raiz lo dejaria con
  // el sufijo dos veces. Sin tituloSeo si usamos la plantilla.
  const title = producto.tituloSeo !== null ? { absolute: producto.tituloSeo } : producto.nombre;

  // Al compartir la ficha por WhatsApp se ve la foto del producto, no la
  // imagen general de la tienda.
  const foto = producto.imagenes[0];
  const openGraph = foto ? { images: [{ url: foto.url, alt: foto.alt }] } : undefined;

  return {
    title,
    ...(descripcion !== null ? { description: descripcion } : {}),
    ...(openGraph ? { openGraph } : {}),
  };
}

export default async function PaginaProducto({ params }: Props) {
  const { slug } = await params;
  const producto = await productoPorSlug(slug);

  if (producto === null) notFound();

  return (
    <main>
      <Contenedor>
        <Migas
          tramos={[
            { nombre: "Inicio", href: "/" },
            ...(producto.categoria.padre
              ? [
                  {
                    nombre: producto.categoria.padre.nombre,
                    href: `/categorias/${producto.categoria.padre.slug}`,
                  },
                ]
              : []),
            { nombre: producto.categoria.nombre, href: `/categorias/${producto.categoria.slug}` },
            { nombre: producto.nombre },
          ]}
        />
        <FichaProductoCliente
          nombre={producto.nombre}
          marca={producto.marca}
          descripcion={producto.descripcion}
          imagenes={producto.imagenes}
          precio={producto.precio}
          precioLista={producto.precioLista}
          descuentoPct={producto.descuentoPct}
          disponible={producto.disponible}
          stockBajo={producto.stockBajo}
          stockTotal={producto.stockTotal}
          opciones={producto.opciones}
          {...(producto.calificacion
            ? {
                calificacion: producto.calificacion.promedio,
                totalOpiniones: producto.calificacion.total,
              }
            : {})}
          extras={<SeccionesFicha />}
        />
        <ListaResenas calificacion={producto.calificacion} resenas={producto.resenas} />
      </Contenedor>
      <script
        type="application/ld+json"
        // JSON.stringify no escapa "<": sin esto, un comentario con "</script>"
        // cerraria la etiqueta antes de tiempo.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: datos propios, escapados arriba.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datosEstructurados(producto)).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}

/**
 * Datos del producto para Google (schema.org/Product). Con reseñas publicadas
 * lleva la nota media: es lo que permite que las estrellas salgan en los
 * resultados de busqueda.
 */
function datosEstructurados(producto: ProductoDeFicha) {
  const url = `${URL_TIENDA}/productos/${producto.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    url,
    ...(producto.descripcionCorta ? { description: producto.descripcionCorta } : {}),
    ...(producto.marca ? { brand: { "@type": "Brand", name: producto.marca } } : {}),
    image: producto.imagenes.map((imagen) => new URL(imagen.url, URL_TIENDA).toString()),
    offers: {
      "@type": "Offer",
      url,
      price: producto.precio.toFixed(2),
      priceCurrency: "PEN",
      availability: producto.disponible
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(producto.calificacion
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: producto.calificacion.promedio,
            reviewCount: producto.calificacion.total,
            bestRating: 5,
            worstRating: 1,
          },
          review: producto.resenas.map((resena) => ({
            "@type": "Review",
            author: { "@type": "Person", name: resena.autor },
            datePublished: resena.fecha.slice(0, 10),
            reviewRating: { "@type": "Rating", ratingValue: resena.estrellas, bestRating: 5 },
            ...(resena.comentario ? { reviewBody: resena.comentario } : {}),
          })),
        }
      : {}),
  };
}
