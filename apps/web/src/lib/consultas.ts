import { cacheLife, cacheTag } from "next/cache";

import type { FiltrosListado } from "@appweb/core";
import { prisma } from "@appweb/db";
import type { BannerDePortada } from "@appweb/ui";

import {
  type CategoriaDeListado,
  type Facetas,
  leerBanners,
  leerBusqueda,
  leerCategoria,
  leerCategorias,
  leerFacetas,
  leerFicha,
  leerListado,
  leerMarca,
  leerNovedades,
  leerOfertas,
  leerPorSlugs,
  leerVarianteDeCarrito,
  type MarcaConProductos,
  type ProductoDeFicha,
  type ProductoDeRejilla,
  type ResenaDeFicha,
  type VarianteDeCarrito,
} from "@appweb/api/catalogo";

import { etiquetas } from "./cache";

export type {
  CategoriaDeListado,
  Facetas,
  MarcaConProductos,
  ProductoDeFicha,
  ProductoDeRejilla,
  ResenaDeFicha,
  VarianteDeCarrito,
};

export interface MarcaDeFicha {
  slug: string;
  nombre: string;
  logo?: string | null;
}

/**
 * Categorias de la cabecera, en el orden del panel. Etiqueta `navegacion`:
 * crear, renombrar u ordenar una categoria la invalida en todas las paginas.
 */
export async function categoriasDeNavegacion(): Promise<{ slug: string; nombre: string }[]> {
  "use cache";
  cacheLife("days");
  cacheTag(etiquetas.navegacion());

  return leerCategorias();
}

/**
 * Promociones del carrusel de la portada, en el orden del panel. Etiqueta
 * `portada`: el panel la invalida al guardar un banner.
 */
export async function bannersDePortada(): Promise<BannerDePortada[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  return leerBanners();
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

  return leerOfertas(limite);
}

/**
 * Varias tarjetas por slug (los favoritos de la app). Cache corta por lista:
 * cada celular pide la suya y caduca sola.
 */
export async function productosPorSlugs(slugs: string[]): Promise<ProductoDeRejilla[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(etiquetas.catalogo());

  return leerPorSlugs(slugs);
}

export async function productosNuevos(limite = 5): Promise<ProductoDeRejilla[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  return leerNovedades(limite);
}

/**
 * Pagina de una marca: sus productos visibles. Etiqueta `portada`, la misma
 * que el carrusel de marcas: guardar cualquier producto la invalida
 * (`etiquetasDeProducto` la incluye), asi precio y stock no quedan viejos.
 */
export async function marcaConProductos(slug: string): Promise<MarcaConProductos | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  return leerMarca(slug);
}

/** Marcas con pagina propia, para `generateStaticParams`. Corre en build. */
export async function slugsDeMarcas(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.catalogo());

  const filas = await prisma.marca.findMany({
    where: { activo: true, productos: { some: { activo: true } } },
    select: { slug: true },
  });
  return filas.map((fila) => fila.slug);
}

// ── Listados: categoria y busqueda ─────────────────────────────────────────

/** Una categoria activa con su padre y sus hijas. Etiqueta `navegacion`, como el menu. */
export async function categoriaPorSlug(slug: string): Promise<CategoriaDeListado | null> {
  "use cache";
  cacheLife("days");
  cacheTag(etiquetas.navegacion());

  return leerCategoria(slug);
}

/** Categorias activas, para `generateStaticParams`. */
export async function slugsDeCategorias(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag(etiquetas.navegacion());

  const filas = await prisma.categoria.findMany({
    where: { activo: true },
    select: { slug: true },
  });
  return filas.map((fila) => fila.slug);
}

/**
 * Tallas y colores con stock, marcas y limites de precio que existen en la
 * categoria: solo se ofrecen filtros que devuelven algo. Etiquetas
 * `categoria:{slug}` y `portada` (guardar cualquier producto invalida
 * `portada`).
 */
export async function facetasDeCategoria(slug: string): Promise<Facetas> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.categoria(slug), etiquetas.portada());

  return leerFacetas(slug);
}

/**
 * Listado de una categoria con filtros. Cada combinacion de filtros es su
 * propia entrada de cache bajo la misma etiqueta: el visitante no toca la base.
 */
export async function productosDeCategoria(
  slug: string,
  filtros: FiltrosListado,
): Promise<ProductoDeRejilla[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.categoria(slug), etiquetas.portada());

  return leerListado(slug, filtros);
}

/**
 * Busqueda: cada palabra tiene que aparecer en el slug del producto (sin
 * tildes), en su nombre, o en el slug de su marca o categoria. "boxer fila"
 * encuentra los boxers de Fila. Cache corta por termino: no se invalida por
 * evento, caduca sola.
 */
export async function buscarProductos(terminos: string[]): Promise<ProductoDeRejilla[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(etiquetas.catalogo());

  return leerBusqueda(terminos);
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

  return leerFicha(slug);
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
export async function varianteParaCarrito(varianteId: string): Promise<VarianteDeCarrito | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(etiquetas.catalogo());

  return leerVarianteDeCarrito(varianteId);
}

export interface MetodoDeEnvio {
  id: string;
  nombre: string;
  costo: number;
  gratisDesde: number | null;
  /** Departamentos que cubre. Vacio = todo el pais (ver `cubreDepartamento`). */
  departamentos: string[];
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
    select: {
      id: true,
      nombre: true,
      costo: true,
      gratisDesde: true,
      departamentos: true,
    },
  });

  return metodos.map((metodo) => ({
    id: metodo.id,
    nombre: metodo.nombre,
    costo: Number(metodo.costo),
    gratisDesde: metodo.gratisDesde !== null ? Number(metodo.gratisDesde) : null,
    departamentos: metodo.departamentos,
  }));
}

export async function marcas(limite = 10): Promise<MarcaDeFicha[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  const marcas = await prisma.marca.findMany({
    where: { activo: true, productos: { some: { activo: true } } },
    select: { slug: true, nombre: true, logoUrl: true },
    orderBy: [{ destacado: "desc" }, { orden: "asc" }, { nombre: "asc" }],
    take: limite,
  });

  return marcas.map((marca) => ({
    slug: marca.slug,
    nombre: marca.nombre,
    logo: marca.logoUrl,
  }));
}
