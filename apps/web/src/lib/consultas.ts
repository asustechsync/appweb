import { cacheLife, cacheTag } from "next/cache";

import { opcionesDeCompra, resolverDisponibilidad, resolverPrecio } from "@appweb/core";
import type { OpcionDeTalla } from "@appweb/core";
import { prisma } from "@appweb/db";

import { etiquetas } from "./cache";

export interface ProductoDeRejilla {
  slug: string;
  nombre: string;
  marca: string | null;
  imagenUrl: string;
  precio: number;
  precioLista: number | null;
  descuentoPct: number | null;
  etiqueta: string | null;
  disponible: boolean;
}

/**
 * Productos en oferta para la portada. Etiqueta `portada`: se invalida
 * cuando el panel cambia el precio o el precioLista de cualquier producto.
 *
 * `resolverPrecio` y `resolverDisponibilidad` de @appweb/core deciden si es
 * oferta de verdad y si hay stock — las mismas funciones que usara la
 * ficha, para no calcular lo mismo dos veces con resultados distintos.
 */
export async function productosEnOferta(limite = 10): Promise<ProductoDeRejilla[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  const productos = await prisma.producto.findMany({
    where: { activo: true, precioLista: { not: null } },
    orderBy: { creadoEn: "desc" },
    take: limite,
    include: {
      imagenes: { orderBy: { orden: "asc" }, take: 1 },
      variantes: { select: { stock: true, activa: true, talla: true, color: true } },
    },
  });

  const resueltos = productos.map((p): ProductoDeRejilla | null => {
    const precio = resolverPrecio({
      precio: Number(p.precio),
      precioLista: p.precioLista !== null ? Number(p.precioLista) : null,
    });

    if (!precio.enOferta) return null;

    const disponibilidad = resolverDisponibilidad(p.variantes);

    return {
      slug: p.slug,
      nombre: p.nombre,
      marca: p.marca,
      imagenUrl: p.imagenes[0]?.url ?? "",
      precio: precio.precio,
      precioLista: precio.precioLista,
      descuentoPct: precio.descuentoPct,
      etiqueta: p.etiqueta,
      disponible: disponibilidad.hayStock,
    };
  });

  return resueltos.filter((p): p is ProductoDeRejilla => p !== null);
}

export async function productosNuevos(limite = 10): Promise<ProductoDeRejilla[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    take: limite,
    include: {
      imagenes: { orderBy: { orden: "asc" }, take: 1 },
      variantes: { select: { stock: true, activa: true, talla: true, color: true } },
    },
  });

  const resueltos = productos.map((p): ProductoDeRejilla => {
    const precio = resolverPrecio({
      precio: Number(p.precio),
      precioLista: p.precioLista !== null ? Number(p.precioLista) : null,
    });

    const disponibilidad = resolverDisponibilidad(p.variantes);

    return {
      slug: p.slug,
      nombre: p.nombre,
      marca: p.marca,
      imagenUrl: p.imagenes[0]?.url ?? "",
      precio: precio.precio,
      precioLista: precio.precioLista,
      descuentoPct: precio.descuentoPct,
      etiqueta: p.etiqueta,
      disponible: disponibilidad.hayStock,
    };
  });

  return resueltos;
}

export interface ProductoDeFicha {
  slug: string;
  nombre: string;
  marca: string | null;
  descripcion: string | null;
  descripcionCorta: string | null;
  etiqueta: string | null;
  tituloSeo: string | null;
  descripcionSeo: string | null;
  categoria: { slug: string; nombre: string };
  imagenes: { url: string; alt: string }[];
  precio: number;
  precioLista: number | null;
  descuentoPct: number | null;
  disponible: boolean;
  stockBajo: boolean;
  stockTotal: number;
  opciones: OpcionDeTalla[];
}

/**
 * Ficha completa de un producto. Etiqueta `producto:{slug}`: el panel guarda
 * ese producto e invalida solo su pagina, no todo el catalogo.
 *
 * Devuelve `null` si el slug no existe o el producto esta inactivo — la
 * pagina decide que eso es un 404. Un producto oculto no debe distinguirse
 * de uno inexistente.
 */
export async function productoPorSlug(slug: string): Promise<ProductoDeFicha | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.producto(slug));

  const producto = await prisma.producto.findFirst({
    where: { slug, activo: true },
    include: {
      categoria: { select: { slug: true, nombre: true } },
      imagenes: { orderBy: { orden: "asc" } },
      variantes: {
        where: { activa: true },
        orderBy: [{ talla: "asc" }, { color: "asc" }],
        select: { talla: true, color: true, stock: true, activa: true },
      },
    },
  });

  if (producto === null) return null;

  const precio = resolverPrecio({
    precio: Number(producto.precio),
    precioLista: producto.precioLista !== null ? Number(producto.precioLista) : null,
  });
  const disponibilidad = resolverDisponibilidad(producto.variantes);

  return {
    slug: producto.slug,
    nombre: producto.nombre,
    marca: producto.marca,
    descripcion: producto.descripcion,
    descripcionCorta: producto.descripcionCorta,
    etiqueta: producto.etiqueta,
    tituloSeo: producto.tituloSeo,
    descripcionSeo: producto.descripcionSeo,
    categoria: producto.categoria,
    imagenes: producto.imagenes.map((imagen) => ({
      url: imagen.url,
      alt: imagen.alt ?? producto.nombre,
    })),
    precio: precio.precio,
    precioLista: precio.precioLista,
    descuentoPct: precio.descuentoPct,
    disponible: disponibilidad.hayStock,
    stockBajo: disponibilidad.stockBajo,
    stockTotal: disponibilidad.stockTotal,
    opciones: opcionesDeCompra(producto.variantes),
  };
}

/**
 * Slugs activos para `generateStaticParams`. Corre en build, no en el request
 * del visitante. Etiqueta `catalogo`: alta o baja de productos la invalida.
 */
export async function slugsDeProductos(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.catalogo());

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    select: { slug: true },
  });

  return productos.map((producto) => producto.slug);
}
