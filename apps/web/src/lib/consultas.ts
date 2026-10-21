import { cacheLife, cacheTag } from "next/cache";

import {
  autorDeResena,
  compararTallas,
  urlDeFoto,
  opcionesDeCompra,
  resolverDisponibilidad,
  resolverNivelStock,
  resolverPrecio,
  resumenCalificacion,
} from "@appweb/core";
import type { FiltrosListado, OpcionDeTalla, ResumenCalificacion } from "@appweb/core";
import { type Prisma, prisma } from "@appweb/db";
import type { BannerDePortada } from "@appweb/ui";

import { etiquetas } from "./cache";

export interface ProductoDeRejilla {
  slug: string;
  nombre: string;
  descripcionCorta: string | null;
  categoria: string;
  categoriaSlug?: string;
  tallas?: string[];
  /** SKU de la primera variante con stock (o de la primera, si no hay). */
  sku?: string | null;
  marca: string | null;
  imagenUrl: string;
  precio: number;
  precioLista: number | null;
  descuentoPct: number | null;
  etiqueta: string | null;
  envioGratis: boolean;
  disponible: boolean;
  /** Unidades que quedan y % de lo ingresado que sigue en almacen (tarjeta de oferta). */
  stockRestante?: number | null;
  stockPct?: number | null;
  /** Nota de las reseñas publicadas. `null` si aun no hay ninguna. */
  calificacion: ResumenCalificacion | null;
}

/**
 * Nota de cada producto: cuantas reseñas publicadas tiene y la suma de sus
 * estrellas, en una sola consulta agrupada. El promedio lo saca
 * `resumenCalificacion` de @appweb/core.
 */
async function calificacionPorProducto(
  ids: string[],
): Promise<Map<string, ResumenCalificacion | null>> {
  const filas = await prisma.resena.groupBy({
    by: ["productoId"],
    where: { productoId: { in: ids }, estado: "APROBADA" },
    _count: { _all: true },
    _sum: { estrellas: true },
  });
  return new Map(
    filas.map((f) => [f.productoId, resumenCalificacion(f._count._all, f._sum.estrellas ?? 0)]),
  );
}

/** Lo ingresado por producto: la suma de las entradas de MovimientoStock, no una columna. */
async function ingresadoPorProducto(ids: string[]): Promise<Map<string, number>> {
  const entradas = await prisma.movimientoStock.findMany({
    where: { delta: { gt: 0 }, variante: { productoId: { in: ids } } },
    select: { delta: true, variante: { select: { productoId: true } } },
  });
  const ingresado = new Map<string, number>();
  for (const entrada of entradas) {
    const id = entrada.variante.productoId;
    ingresado.set(id, (ingresado.get(id) ?? 0) + entrada.delta);
  }
  return ingresado;
}

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

  // Solo las de primer nivel y activas: las hijas iran en el listado de cada una.
  return prisma.categoria.findMany({
    where: { activo: true, padreId: null },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    select: { slug: true, nombre: true },
  });
}

/**
 * Promociones del carrusel de la portada, en el orden del panel. Etiqueta
 * `portada`: el panel la invalida al guardar un banner.
 */
export async function bannersDePortada(): Promise<BannerDePortada[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  const banners = await prisma.banner.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { creadoEn: "asc" }],
    select: {
      etiqueta: true,
      titulo: true,
      texto: true,
      href: true,
      accion: true,
    },
  });

  return banners.map((banner) => ({
    etiqueta: banner.etiqueta,
    titulo: banner.titulo,
    detalle: banner.texto,
    href: banner.href,
    accion: banner.accion,
  }));
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
      variantes: {
        select: { stock: true, activo: true, talla: true, color: true, sku: true },
      },
      categoria: { select: { nombre: true } },
      marca: { select: { nombre: true } },
    },
  });

  const ids = productos.map((p) => p.id);
  const [ingresado, calificaciones] = await Promise.all([
    ingresadoPorProducto(ids),
    calificacionPorProducto(ids),
  ]);

  const resueltos = productos.map((p): ProductoDeRejilla | null => {
    const precio = resolverPrecio({
      precio: Number(p.precio),
      precioLista: p.precioLista !== null ? Number(p.precioLista) : null,
    });

    if (!precio.enOferta) return null;

    const disponibilidad = resolverDisponibilidad(p.variantes);
    const nivel = resolverNivelStock(disponibilidad.stockTotal, ingresado.get(p.id) ?? 0);

    return {
      slug: p.slug,
      nombre: p.nombre,
      descripcionCorta: p.descripcionCorta,
      categoria: p.categoria.nombre,
      marca: p.marca?.nombre ?? null,
      imagenUrl: urlDeFoto(p.imagenes[0]?.url),
      precio: precio.precio,
      precioLista: precio.precioLista,
      descuentoPct: precio.descuentoPct,
      etiqueta: p.etiqueta,
      envioGratis: p.envioGratis,
      disponible: disponibilidad.hayStock,
      stockRestante: nivel.restante,
      stockPct: nivel.porcentaje,
      calificacion: calificaciones.get(p.id) ?? null,
    };
  });

  return resueltos.filter((p): p is ProductoDeRejilla => p !== null);
}

/** SKU que muestra la tarjeta: el de la primera variante con stock, o el de la primera. */
function skuDeMuestra(variantes: { sku: string; stock: number; activo: boolean }[]): string | null {
  const elegida = variantes.find((v) => v.activo && v.stock > 0) ?? variantes[0];
  return elegida?.sku ?? null;
}

/** Lo que una tarjeta de producto necesita leer de la base. */
const INCLUIR_EN_REJILLA = {
  imagenes: { orderBy: { orden: "asc" as const }, take: 1 },
  variantes: {
    select: { stock: true, activo: true, talla: true, color: true, sku: true },
  },
  categoria: { select: { nombre: true, slug: true } },
  marca: { select: { nombre: true } },
};

type ProductoConRejilla = Awaited<
  ReturnType<typeof prisma.producto.findMany<{ include: typeof INCLUIR_EN_REJILLA }>>
>[number];

/**
 * De la fila de la base a la tarjeta del catalogo. Precio, stock y nivel los
 * deciden las funciones de @appweb/core: portada, marca y categoria muestran
 * exactamente lo mismo para el mismo producto.
 */
async function aRejilla(productos: ProductoConRejilla[]): Promise<ProductoDeRejilla[]> {
  const ids = productos.map((p) => p.id);
  const [ingresado, calificaciones] = await Promise.all([
    ingresadoPorProducto(ids),
    calificacionPorProducto(ids),
  ]);

  return productos.map((producto): ProductoDeRejilla => {
    const precio = resolverPrecio({
      precio: Number(producto.precio),
      precioLista: producto.precioLista !== null ? Number(producto.precioLista) : null,
    });
    const disponibilidad = resolverDisponibilidad(producto.variantes);
    const nivel = resolverNivelStock(disponibilidad.stockTotal, ingresado.get(producto.id) ?? 0);

    return {
      slug: producto.slug,
      nombre: producto.nombre,
      descripcionCorta: producto.descripcionCorta,
      categoria: producto.categoria.nombre,
      categoriaSlug: producto.categoria.slug,
      tallas: disponibilidad.tallas,
      sku: skuDeMuestra(producto.variantes),
      marca: producto.marca?.nombre ?? null,
      imagenUrl: urlDeFoto(producto.imagenes[0]?.url),
      precio: precio.precio,
      precioLista: precio.precioLista,
      descuentoPct: precio.descuentoPct,
      etiqueta: producto.etiqueta,
      envioGratis: producto.envioGratis,
      disponible: disponibilidad.hayStock,
      stockRestante: nivel.restante,
      stockPct: nivel.porcentaje,
      calificacion: calificaciones.get(producto.id) ?? null,
    };
  });
}

export async function productosNuevos(limite = 5): Promise<ProductoDeRejilla[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    take: limite,
    include: INCLUIR_EN_REJILLA,
  });

  return aRejilla(productos);
}

export interface MarcaConProductos {
  nombre: string;
  logo: string | null;
  productos: ProductoDeRejilla[];
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

  const marca = await prisma.marca.findFirst({
    where: { slug, activo: true },
    select: { id: true, nombre: true, logoUrl: true },
  });
  if (marca === null) return null;

  const productos = await prisma.producto.findMany({
    where: { activo: true, marcaId: marca.id },
    orderBy: [{ destacado: "desc" }, { creadoEn: "desc" }],
    include: INCLUIR_EN_REJILLA,
  });

  return {
    nombre: marca.nombre,
    logo: marca.logoUrl,
    productos: await aRejilla(productos),
  };
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

export interface CategoriaDeListado {
  slug: string;
  nombre: string;
  descripcion: string | null;
  tituloSeo: string | null;
  descripcionSeo: string | null;
  padre: { slug: string; nombre: string } | null;
  hijas: { slug: string; nombre: string }[];
}

/** Una categoria activa con su padre y sus hijas. Etiqueta `navegacion`, como el menu. */
export async function categoriaPorSlug(slug: string): Promise<CategoriaDeListado | null> {
  "use cache";
  cacheLife("days");
  cacheTag(etiquetas.navegacion());

  return prisma.categoria.findFirst({
    where: { slug, activo: true },
    select: {
      slug: true,
      nombre: true,
      descripcion: true,
      tituloSeo: true,
      descripcionSeo: true,
      padre: { select: { slug: true, nombre: true } },
      hijas: {
        where: { activo: true },
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
        select: { slug: true, nombre: true },
      },
    },
  });
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

/** Productos de la categoria y de sus hijas: una camiseta de "Boxers" tambien es de "Hombres". */
function enCategoria(slug: string): Prisma.ProductoWhereInput {
  return {
    categoria: { activo: true, OR: [{ slug }, { padre: { slug } }] },
  };
}

export interface Facetas {
  tallas: string[];
  /** Colores con stock, con la escritura con que los guarda la variante. */
  colores: string[];
  marcas: { slug: string; nombre: string }[];
  /**
   * Precio mas bajo y mas alto de la categoria en soles enteros (el minimo
   * redondeado hacia abajo y el maximo hacia arriba, para que el rango
   * completo incluya a todos). `null` si hay menos de dos precios distintos:
   * sin rango que recorrer, no hay barra.
   */
  precio: { min: number; max: number } | null;
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

  const productos = await prisma.producto.findMany({
    where: { activo: true, ...enCategoria(slug) },
    select: {
      precio: true,
      marca: { select: { slug: true, nombre: true, activo: true } },
      variantes: {
        where: { activo: true, stock: { gt: 0 } },
        select: { talla: true, color: true },
      },
    },
  });

  const tallas = new Set<string>();
  // Clave en minusculas: "negro" y "Negro" son el mismo color en el filtro.
  const colores = new Map<string, string>();
  const marcas = new Map<string, string>();
  let masBarato = Number.POSITIVE_INFINITY;
  let masCaro = Number.NEGATIVE_INFINITY;
  for (const p of productos) {
    for (const v of p.variantes) {
      tallas.add(v.talla.toUpperCase());
      const clave = v.color.toLowerCase();
      if (!colores.has(clave)) colores.set(clave, v.color);
    }
    if (p.marca?.activo) marcas.set(p.marca.slug, p.marca.nombre);
    masBarato = Math.min(masBarato, Number(p.precio));
    masCaro = Math.max(masCaro, Number(p.precio));
  }
  const min = Math.floor(masBarato);
  const max = Math.ceil(masCaro);
  return {
    tallas: [...tallas].sort(compararTallas),
    colores: [...colores.values()].sort((a, b) => a.localeCompare(b, "es")),
    marcas: [...marcas]
      .map(([slugMarca, nombre]) => ({ slug: slugMarca, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    precio: Number.isFinite(min) && Number.isFinite(max) && max > min ? { min, max } : null,
  };
}

/** Tope de un listado: suficiente para el catalogo actual sin paginar. */
const TOPE_LISTADO = 120;

function condicionesDeFiltros(f: FiltrosListado): Prisma.ProductoWhereInput[] {
  const y: Prisma.ProductoWhereInput[] = [];
  if (f.sub) y.push({ categoria: { slug: f.sub, activo: true } });
  if (f.marca) y.push({ marca: { slug: f.marca, activo: true } });
  if (f.ofertas) y.push({ precioLista: { not: null } });
  if (f.precioMin !== null || f.precioMax !== null) {
    y.push({
      precio: {
        ...(f.precioMin !== null ? { gte: f.precioMin } : {}),
        ...(f.precioMax !== null ? { lte: f.precioMax } : {}),
      },
    });
  }
  // Talla, color y "solo en stock" se piden de una sola variante: "talla M en
  // Negro" tiene que existir como una misma fila, no una M y un Negro sueltos.
  if (f.talla || f.color || f.stock) {
    y.push({
      variantes: {
        some: {
          activo: true,
          stock: { gt: 0 },
          ...(f.talla ? { talla: { equals: f.talla, mode: "insensitive" as const } } : {}),
          ...(f.color ? { color: { equals: f.color, mode: "insensitive" as const } } : {}),
        },
      },
    });
  }
  return y;
}

function ordenDe(f: FiltrosListado): Prisma.ProductoOrderByWithRelationInput[] {
  if (f.orden === "precio-asc") return [{ precio: "asc" }, { nombre: "asc" }];
  if (f.orden === "precio-desc") return [{ precio: "desc" }, { nombre: "asc" }];
  return [{ destacado: "desc" }, { creadoEn: "desc" }];
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

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      AND: [enCategoria(slug), ...condicionesDeFiltros(filtros)],
    },
    orderBy: ordenDe(filtros),
    take: TOPE_LISTADO,
    include: INCLUIR_EN_REJILLA,
  });
  return aRejilla(productos);
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

  if (terminos.length === 0) return [];
  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      categoria: { activo: true },
      AND: terminos.map((t) => ({
        OR: [
          { slug: { contains: t } },
          { nombre: { contains: t, mode: "insensitive" as const } },
          { marca: { slug: { contains: t } } },
          { categoria: { slug: { contains: t } } },
        ],
      })),
    },
    orderBy: [{ destacado: "desc" }, { creadoEn: "desc" }],
    take: TOPE_LISTADO,
    include: INCLUIR_EN_REJILLA,
  });
  return aRejilla(productos);
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
  categoria: {
    slug: string;
    nombre: string;
    padre: { slug: string; nombre: string } | null;
  };
  imagenes: { url: string; alt: string }[];
  precio: number;
  precioLista: number | null;
  descuentoPct: number | null;
  disponible: boolean;
  stockBajo: boolean;
  stockTotal: number;
  opciones: OpcionDeTalla[];
  calificacion: ResumenCalificacion | null;
  /** Las reseñas publicadas mas recientes. */
  resenas: ResenaDeFicha[];
}

export interface ResenaDeFicha {
  id: string;
  autor: string;
  estrellas: number;
  comentario: string | null;
  /** ISO 8601. */
  fecha: string;
}

/** Cuantas opiniones muestra la ficha. La nota cuenta todas. */
const TOPE_RESENAS_FICHA = 20;

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
      categoria: {
        select: {
          slug: true,
          nombre: true,
          padre: { select: { slug: true, nombre: true } },
        },
      },
      marca: { select: { nombre: true } },
      imagenes: { orderBy: { orden: "asc" } },
      variantes: {
        where: { activo: true },
        orderBy: [{ talla: "asc" }, { color: "asc" }],
        select: {
          id: true,
          talla: true,
          color: true,
          sku: true,
          stock: true,
          activo: true,
        },
      },
    },
  });

  if (producto === null) return null;

  const precio = resolverPrecio({
    precio: Number(producto.precio),
    precioLista: producto.precioLista !== null ? Number(producto.precioLista) : null,
  });
  const disponibilidad = resolverDisponibilidad(producto.variantes);

  // Etiqueta `producto:{slug}`: publicar o retirar una reseña en el panel
  // regenera esta ficha (ver `etiquetasDeProducto`).
  const [calificaciones, resenas] = await Promise.all([
    calificacionPorProducto([producto.id]),
    prisma.resena.findMany({
      where: { productoId: producto.id, estado: "APROBADA" },
      orderBy: { creadoEn: "desc" },
      take: TOPE_RESENAS_FICHA,
      select: {
        id: true,
        estrellas: true,
        comentario: true,
        creadoEn: true,
        usuario: { select: { nombre: true, apellidoPaterno: true, email: true } },
      },
    }),
  ]);

  return {
    slug: producto.slug,
    nombre: producto.nombre,
    marca: producto.marca?.nombre ?? null,
    descripcion: producto.descripcion,
    descripcionCorta: producto.descripcionCorta,
    etiqueta: producto.etiqueta,
    tituloSeo: producto.tituloSeo,
    descripcionSeo: producto.descripcionSeo,
    categoria: producto.categoria,
    imagenes: producto.imagenes
      .filter((imagen) => urlDeFoto(imagen.url) !== "")
      .map((imagen) => ({
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
        sku: variante.sku,
      })),
    ),
    calificacion: calificaciones.get(producto.id) ?? null,
    resenas: resenas.map((r) => ({
      id: r.id,
      autor: autorDeResena(r.usuario),
      estrellas: r.estrellas,
      comentario: r.comentario,
      fecha: r.creadoEn.toISOString(),
    })),
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
export async function varianteParaCarrito(varianteId: string): Promise<VarianteDeCarrito | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(etiquetas.catalogo());

  const variante = await prisma.variante.findFirst({
    where: { id: varianteId, activo: true, producto: { activo: true } },
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
          imagenes: {
            orderBy: { orden: "asc" },
            take: 1,
            select: { url: true },
          },
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
    imagenUrl: urlDeFoto(producto.imagenes[0]?.url),
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
