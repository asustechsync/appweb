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

export interface MarcaDeFicha {
  slug: string;
  nombre: string;
  logo?: string | null;
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
        select: { id: true, talla: true, color: true, stock: true, activa: true },
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
    opciones: opcionesDeCompra(
      producto.variantes.map((variante) => ({
        varianteId: variante.id,
        talla: variante.talla,
        color: variante.color,
        stock: variante.stock,
      })),
    ),
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

export interface VarianteDeCarrito {
  varianteId: string;
  slug: string;
  nombre: string;
  talla: string;
  color: string;
  imagenUrl: string;
  precio: number;
  precioLista: number | null;
  stock: number;
}

/**
 * Datos frescos de una variante para pintar su linea del carrito.
 *
 * El carrito guardado solo tiene varianteId y cantidad: el precio, el nombre y
 * el stock se leen aqui en cada visita. Un carrito de hace una semana cobraria
 * el precio de hace una semana si se guardara con la linea.
 *
 * Cacheada por variante y con vida corta: el stock cambia con cada venta y
 * mostrar uno muy viejo llevaria a prometer unidades que ya no estan. La
 * comprobacion que manda sigue siendo la del checkout, contra MovimientoStock.
 */
export async function varianteParaCarrito(
  varianteId: string,
): Promise<VarianteDeCarrito | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(etiquetas.catalogo());

  const variante = await prisma.variante.findFirst({
    where: { id: varianteId, activa: true, producto: { activo: true } },
    select: {
      id: true,
      talla: true,
      color: true,
      stock: true,
      producto: {
        select: {
          slug: true,
          nombre: true,
          precio: true,
          precioLista: true,
          imagenes: { orderBy: { orden: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });

  if (variante === null) return null;

  const { producto } = variante;
  const precio = resolverPrecio({
    precio: Number(producto.precio),
    precioLista: producto.precioLista !== null ? Number(producto.precioLista) : null,
  });

  return {
    varianteId: variante.id,
    slug: producto.slug,
    nombre: producto.nombre,
    talla: variante.talla,
    color: variante.color,
    imagenUrl: producto.imagenes[0]?.url ?? "",
    precio: precio.precio,
    precioLista: precio.precioLista,
    stock: variante.stock,
  };
}

export interface MetodoDeEnvio {
  id: string;
  nombre: string;
  costo: number;
  gratisDesde: number | null;
}

/**
 * Metodos de envio activos, para el resumen del carrito y el checkout.
 * Etiqueta `envios`: cambiar una tarifa en el panel invalida las dos pantallas.
 */
export async function metodosDeEnvio(): Promise<MetodoDeEnvio[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.envios());

  const metodos = await prisma.metodoEnvio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true, costo: true, gratisDesde: true },
  });

  return metodos.map((metodo) => ({
    id: metodo.id,
    nombre: metodo.nombre,
    costo: Number(metodo.costo),
    gratisDesde: metodo.gratisDesde !== null ? Number(metodo.gratisDesde) : null,
  }));
}

export async function marcas(limite = 10): Promise<MarcaDeFicha[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  const productos = await prisma.producto.findMany({
    where: { activo: true, marca: { not: null } },
    select: { marca: true },
    distinct: ["marca"],
    take: limite,
  });

  return productos
    .map((p) => p.marca)
    .filter((marca): marca is string => marca !== null)
    .map((marca) => ({
      slug: marca.toLowerCase().replace(/\s+/g, "-"),
      nombre: marca,
    }));
}
