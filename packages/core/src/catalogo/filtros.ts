/**
 * Filtros del listado de una categoria y terminos de la busqueda.
 *
 * Los filtros viajan en la URL (`?talla=M&orden=precio-asc`) y la pagina los
 * pinta como enlaces: sin estado de cliente que hidratar, y cada combinacion
 * se cachea por separado. Aqui se lee y se escribe esa URL, validando todo lo
 * que llega: un parametro raro se ignora, nunca llega crudo a la base.
 */

import { slugDesdeTexto } from "./gestion";

export const ORDENES = ["novedades", "precio-asc", "precio-desc"] as const;
export type Orden = (typeof ORDENES)[number];

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  novedades: "Novedades",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
};

/**
 * Tope de un precio en la URL: cinco cifras bastan para cualquier producto
 * de la tienda y evitan que un numero enorme llegue a la base.
 */
const PRECIO_MAXIMO_URL = 99999;

export interface FiltrosListado {
  /** Subcategoria (slug) dentro de la categoria. */
  sub: string | null;
  talla: string | null;
  /** Color tal como lo guarda la variante ("Azul marino"). */
  color: string | null;
  /** Marca (slug). */
  marca: string | null;
  /** Precio minimo y maximo en soles enteros; `null` es sin limite. */
  precioMin: number | null;
  precioMax: number | null;
  orden: Orden;
  /** Solo productos con precio rebajado. */
  ofertas: boolean;
  /** Solo productos con alguna variante en stock. */
  stock: boolean;
}

export const SIN_FILTROS: FiltrosListado = {
  sub: null,
  talla: null,
  color: null,
  marca: null,
  precioMin: null,
  precioMax: null,
  orden: "novedades",
  ofertas: false,
  stock: false,
};

type Parametros = Record<string, string | string[] | undefined>;

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** "M", "XL", "38-40", "6M": letras, numeros y un guion; nada mas. */
const TALLA = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)?$/;

/** "Negro", "Azul marino": letras con tildes, numeros y espacios sueltos. */
const COLOR = /^[\p{L}0-9]+(?: [\p{L}0-9]+)*$/u;

function slugValido(valor: string | undefined): string | null {
  return valor && valor.length <= 80 && SLUG.test(valor) ? valor : null;
}

/** Un precio entero de la URL ("45"), o null si no lo es. */
function precioValido(valor: string | undefined): number | null {
  if (!valor || !/^\d{1,5}$/.test(valor)) return null;
  const precio = Number(valor);
  return precio <= PRECIO_MAXIMO_URL ? precio : null;
}

/** Lee los filtros de la URL. Lo que no es valido se descarta en silencio. */
export function filtrosDesdeUrl(parametros: Parametros): FiltrosListado {
  const talla = primero(parametros["talla"]);
  const color = primero(parametros["color"])?.trim();
  const orden = primero(parametros["orden"]);
  let precioMin = precioValido(primero(parametros["precioMin"]));
  let precioMax = precioValido(primero(parametros["precioMax"]));
  // Un rango al reves no devuelve nada: se descarta entero.
  if (precioMin !== null && precioMax !== null && precioMin > precioMax) {
    precioMin = null;
    precioMax = null;
  }
  return {
    sub: slugValido(primero(parametros["sub"])),
    talla: talla && talla.length <= 12 && TALLA.test(talla) ? talla.toUpperCase() : null,
    color: color && color.length <= 30 && COLOR.test(color) ? color : null,
    marca: slugValido(primero(parametros["marca"])),
    precioMin,
    precioMax,
    orden: ORDENES.includes(orden as Orden) ? (orden as Orden) : "novedades",
    ofertas: primero(parametros["ofertas"]) === "1",
    stock: primero(parametros["stock"]) === "1",
  };
}

/**
 * URL del listado con un filtro cambiado. Lo que queda en su valor por
 * defecto no se escribe: `/categorias/hombres` y no `?orden=novedades`. La
 * base puede traer ya su query (`/buscar?q=boxer`): se agrega con `&`.
 */
export function urlDeFiltros(
  base: string,
  actuales: FiltrosListado,
  cambio: Partial<FiltrosListado> = {},
): string {
  const f = { ...actuales, ...cambio };
  const query = new URLSearchParams();
  if (f.sub) query.set("sub", f.sub);
  if (f.talla) query.set("talla", f.talla);
  if (f.color) query.set("color", f.color);
  if (f.marca) query.set("marca", f.marca);
  if (f.precioMin !== null) query.set("precioMin", String(f.precioMin));
  if (f.precioMax !== null) query.set("precioMax", String(f.precioMax));
  if (f.ofertas) query.set("ofertas", "1");
  if (f.stock) query.set("stock", "1");
  if (f.orden !== "novedades") query.set("orden", f.orden);
  const texto = query.toString();
  if (!texto) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${texto}`;
}

/** Si hay algo que limpiar (el orden no cuenta: no quita productos). */
export function hayFiltros(f: FiltrosListado): boolean {
  return (
    f.sub !== null ||
    f.talla !== null ||
    f.color !== null ||
    f.marca !== null ||
    f.precioMin !== null ||
    f.precioMax !== null ||
    f.ofertas ||
    f.stock
  );
}

/**
 * Ordena una lista ya traida (la busqueda se cachea una vez por termino y se
 * ordena despues, sin multiplicar la cache por cada orden). "novedades" deja
 * el orden con que llego.
 */
export function ordenarPorPrecio<T extends { precio: number }>(lista: T[], orden: Orden): T[] {
  if (orden === "precio-asc") return [...lista].sort((a, b) => a.precio - b.precio);
  if (orden === "precio-desc") return [...lista].sort((a, b) => b.precio - a.precio);
  return lista;
}

/** Menos letras no buscan nada util y cargan la base. */
export const MIN_LETRAS_BUSQUEDA = 2;
const MAX_TERMINOS = 5;

/**
 * Palabras de una busqueda, sin tildes ni mayusculas, para compararlas con el
 * slug del producto (que tampoco las tiene): "Algodón Niño" -> ["algodon",
 * "nino"]. Las palabras sueltas de una letra se descartan.
 */
export function terminosDeBusqueda(texto: string): string[] {
  const palabras = slugDesdeTexto(texto.slice(0, 100))
    .split("-")
    .filter((p) => p.length >= MIN_LETRAS_BUSQUEDA);
  return [...new Set(palabras)].slice(0, MAX_TERMINOS);
}
