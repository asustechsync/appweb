/**
 * Lectura del catalogo que comparten la tienda web y la app movil: la tarjeta
 * de producto tal como sale de la base, con precio, stock y nota resueltos por
 * @appweb/core.
 *
 * Aqui no hay cache: la web envuelve estas lecturas con `use cache` en
 * apps/web/src/lib/consultas.ts, y la ruta `catalogo` de tRPC recibe esas
 * mismas funciones cacheadas por el contexto.
 */

import {
  autorDeResena,
  compararTallas,
  type FiltrosListado,
  type BannerDePortada,
  type OpcionDeTalla,
  opcionesDeCompra,
  resolverDisponibilidad,
  resolverNivelStock,
  resolverPrecio,
  resumenCalificacion,
  type ResumenCalificacion,
  urlDeFoto,
} from "@appweb/core";
import { type Prisma, prisma } from "@appweb/db";

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
export async function calificacionPorProducto(
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
export async function ingresadoPorProducto(ids: string[]): Promise<Map<string, number>> {
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

/** SKU que muestra la tarjeta: el de la primera variante con stock, o el de la primera. */
function skuDeMuestra(variantes: { sku: string; stock: number; activo: boolean }[]): string | null {
  const elegida = variantes.find((v) => v.activo && v.stock > 0) ?? variantes[0];
  return elegida?.sku ?? null;
}

/** Lo que una tarjeta de producto necesita leer de la base. */
export const INCLUIR_EN_REJILLA = {
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
export async function aRejilla(productos: ProductoConRejilla[]): Promise<ProductoDeRejilla[]> {
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

/** Los productos activos mas recientes: la seccion "Novedades". */
export async function leerNovedades(limite = 5): Promise<ProductoDeRejilla[]> {
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    take: limite,
    include: INCLUIR_EN_REJILLA,
  });

  return aRejilla(productos);
}

/** Productos con precio de lista mayor al de venta: la seccion "Ofertas". */
export async function leerOfertas(limite = 10): Promise<ProductoDeRejilla[]> {
  const productos = await prisma.producto.findMany({
    where: { activo: true, precioLista: { not: null } },
    orderBy: { creadoEn: "desc" },
    take: limite,
    include: INCLUIR_EN_REJILLA,
  });

  // `resolverPrecio` decide si es oferta de verdad: un precio de lista menor
  // o igual al de venta no lo es, y ahi deja `descuentoPct` en null.
  return (await aRejilla(productos)).filter((p) => p.descuentoPct !== null);
}

/** Categorias de primer nivel y activas, en el orden del panel. */
export function leerCategorias(): Promise<{ slug: string; nombre: string }[]> {
  return prisma.categoria.findMany({
    where: { activo: true, padreId: null },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    select: { slug: true, nombre: true },
  });
}

/** Promociones activas del carrusel de la portada, en el orden del panel. */
export async function leerBanners(): Promise<BannerDePortada[]> {
  const banners = await prisma.banner.findMany({
    where: { activo: true },
    orderBy: [{ orden: "asc" }, { creadoEn: "asc" }],
    select: { etiqueta: true, titulo: true, texto: true, href: true, accion: true },
  });

  return banners.map((banner) => ({
    etiqueta: banner.etiqueta,
    titulo: banner.titulo,
    detalle: banner.texto,
    href: banner.href,
    accion: banner.accion,
  }));
}

export interface ProductoDeFicha {
  slug: string;
  nombre: string;
  marca: string | null;
  /** Para abrir la pagina de la marca desde la ficha. */
  marcaSlug: string | null;
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
 * Ficha completa de un producto: fotos, precio, tallas y colores con su stock,
 * nota y las reseñas mas recientes. `null` si no existe o esta inactivo: un
 * producto oculto no se distingue de uno inexistente.
 */
export async function leerFicha(slug: string): Promise<ProductoDeFicha | null> {
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
      marca: { select: { nombre: true, slug: true } },
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
    marcaSlug: producto.marca?.slug ?? null,
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
 * Datos frescos de una variante para su linea del carrito. El carrito guardado
 * solo tiene varianteId y cantidad: precio, nombre y stock se leen aqui.
 * `null` si la variante o su producto ya no estan activos.
 */
export async function leerVarianteDeCarrito(varianteId: string): Promise<VarianteDeCarrito | null> {
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
export async function leerMarca(slug: string): Promise<MarcaConProductos | null> {
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

// ── Listados: categoria, marca y busqueda ──────────────────────────────────

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
export async function leerCategoria(slug: string): Promise<CategoriaDeListado | null> {
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
export async function leerFacetas(slug: string): Promise<Facetas> {
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
export async function leerListado(
  slug: string,
  filtros: FiltrosListado,
): Promise<ProductoDeRejilla[]> {
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
export async function leerBusqueda(terminos: string[]): Promise<ProductoDeRejilla[]> {
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

/** Tarjetas de varios productos a la vez, en el orden pedido: los favoritos de la app. */
export async function leerPorSlugs(slugs: string[]): Promise<ProductoDeRejilla[]> {
  if (slugs.length === 0) return [];
  const productos = await prisma.producto.findMany({
    where: { activo: true, slug: { in: slugs } },
    include: INCLUIR_EN_REJILLA,
  });
  const tarjetas = await aRejilla(productos);
  const porSlug = new Map(tarjetas.map((p) => [p.slug, p]));
  return slugs.flatMap((slug) => porSlug.get(slug) ?? []);
}
