/**
 * Alta y edicion del catalogo desde el panel: slug, codigo de modelo, SKU y variantes.
 *
 * El SKU y el slug se derivan siempre de la misma forma, se cree el producto
 * desde el panel, la semilla o la app movil. Si cada pantalla los armara a su
 * manera, el almacen terminaria con "BOXER-M-NEGRO" y "boxer_m_negro" para la
 * misma prenda.
 */

/** Imagen de relleno mientras no hay fotos propias: la misma de la semilla. */
export const IMAGEN_DEMO = "/producto.webp";

/** Quita tildes y la ñ: "Única" -> "Unica", "Niño" -> "Nino". */
function sinTildes(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** "Boxer Pima Niño 2x1" -> "boxer-pima-nino-2x1". Vacio si no queda nada util. */
export function slugDesdeTexto(texto: string): string {
  return sinTildes(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

// ── SKU ──────────────────────────────────────────────────────────────────
//
// Formato `BX012-M-112`: tipo de prenda + numero de modelo, talla, y al final
// tres digitos: color (dos) y diseño (uno). Corto y de largo casi fijo; el
// guion antes y despues de la talla evita que "34B" o "3540" se mezclen con
// el numero del modelo.

// Las listas de abajo (tipos, colores, diseños, etiquetas) son solo los
// valores con los que arranca la tienda: `npm run atributos -w @appweb/db` las
// copia a las tablas `tipos_prenda` y `atributos`, y desde ahi el panel las
// amplia. Las funciones reciben la lista vigente como parametro.

/** Tipos de prenda iniciales: las dos letras del codigo, las palabras que los
    delatan en el nombre y las tallas que el panel ofrece marcar. */
export const TIPOS_PRENDA = [
  { codigo: "BX", nombre: "Boxer", palabras: ["boxer"], tallas: ["S", "M", "L", "XL", "XXL"] },
  {
    codigo: "MD",
    nombre: "Medias",
    palabras: ["media", "medias", "calcetin", "calcetines"],
    tallas: ["35-40", "40-45", "Única"],
  },
  {
    codigo: "BR",
    nombre: "Brasier",
    palabras: ["brasier", "bracier", "sosten", "top"],
    tallas: ["32A", "32B", "34A", "34B", "34C", "36B", "36C", "38C"],
  },
  {
    codigo: "GU",
    nombre: "Guantes",
    palabras: ["guante", "guantes"],
    tallas: ["S", "M", "L", "Única"],
  },
  {
    codigo: "PO",
    nombre: "Polo",
    palabras: ["polo", "polos"],
    tallas: ["S", "M", "L", "XL", "XXL"],
  },
  {
    codigo: "CZ",
    nombre: "Calzón",
    palabras: ["calzon", "calzones", "truza", "panty"],
    tallas: ["S", "M", "L", "XL"],
  },
  { codigo: "AC", nombre: "Accesorio", palabras: [], tallas: ["Única"] },
] as const;

/** Tipo que se asume cuando ninguna palabra del nombre coincide. */
export const TIPO_POR_DEFECTO = "AC";

/** "bx" -> `true` para "BX": dos letras sin tildes, que es lo que cabe en el SKU. */
export function esCodigoTipo(texto: string): boolean {
  return /^[A-Z]{2}$/.test(texto);
}

/** "Boxer Algodon Pack x3" -> "BX". Si ninguna palabra coincide, `TIPO_POR_DEFECTO`. */
export function tipoDesdeNombre(
  nombre: string,
  tipos: ReadonlyArray<{ codigo: string; palabras: ReadonlyArray<string> }>,
): string {
  const palabras = new Set(slugDesdeTexto(nombre).split("-"));
  const tipo = tipos.find((t) => t.palabras.some((p) => palabras.has(clave(p))));
  return tipo?.codigo ?? TIPO_POR_DEFECTO;
}

/**
 * Codigo del modelo siguiente de ese tipo: `BX` con `BX001` y `BX012` ya
 * usados -> `BX013`. Nunca rellena huecos: un codigo retirado no se reutiliza.
 */
export function siguienteCodigoProducto(tipo: string, usados: ReadonlyArray<string>): string {
  const mayor = usados
    .filter((c) => c.startsWith(tipo))
    .map((c) => Number(c.slice(tipo.length)))
    .filter(Number.isInteger)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${tipo}${String(mayor + 1).padStart(3, "0")}`;
}

/**
 * Familias de color: la decena del codigo. Un color nuevo toma el siguiente
 * numero libre de su familia; ninguno se borra ni cambia de numero.
 */
export const FAMILIAS_COLOR = [
  { decena: 0, nombre: "Neutros" },
  { decena: 1, nombre: "Azules" },
  { decena: 2, nombre: "Rojos y rosas" },
  { decena: 3, nombre: "Tierras" },
  { decena: 4, nombre: "Verdes" },
  { decena: 5, nombre: "Amarillos y naranjas" },
  { decena: 6, nombre: "Morados" },
  { decena: 7, nombre: "Otros" },
  { decena: 9, nombre: "Especiales" },
] as const;

/**
 * Codigo del siguiente color de una familia: decena 1 con "10" y "11" usados
 * -> "12". `null` si la familia ya tiene sus diez colores. Nunca rellena
 * huecos: un codigo retirado no se reutiliza, porque ya esta en SKU viejos.
 * El "00" no se usa: el primer neutro es "01".
 */
export function siguienteCodigoColor(decena: number, usados: ReadonlyArray<string>): string | null {
  const mayor = usados
    .map(Number)
    .filter((n) => Number.isInteger(n) && Math.floor(n / 10) === decena)
    .reduce((a, n) => Math.max(a, n), decena * 10 - 1);
  const siguiente = Math.max(mayor + 1, decena === 0 ? 1 : 0);
  return Math.floor(siguiente / 10) === decena ? String(siguiente).padStart(2, "0") : null;
}

/** Colores iniciales, con codigo fijo agrupado por familia (ver `FAMILIAS_COLOR`)
    y su muestra en hex. Multicolor no tiene una sola muestra. */
export const COLORES = [
  { codigo: "01", nombre: "Negro", hex: "#1A1A1A" },
  { codigo: "02", nombre: "Blanco", hex: "#FFFFFF" },
  { codigo: "03", nombre: "Gris", hex: "#8C8C8C" },
  { codigo: "04", nombre: "Gris oscuro", hex: "#4A4A4A" },
  { codigo: "05", nombre: "Gris claro", hex: "#C9C9C9" },
  { codigo: "10", nombre: "Azul", hex: "#2563EB" },
  { codigo: "11", nombre: "Azul marino", hex: "#1E2A4A" },
  { codigo: "12", nombre: "Celeste", hex: "#7DD3FC" },
  { codigo: "13", nombre: "Turquesa", hex: "#14B8A6" },
  { codigo: "20", nombre: "Rojo", hex: "#DC2626" },
  { codigo: "21", nombre: "Vino", hex: "#7F1D1D" },
  { codigo: "22", nombre: "Coral", hex: "#F87171" },
  { codigo: "23", nombre: "Rosa", hex: "#F9A8D4" },
  { codigo: "24", nombre: "Rosa palo", hex: "#F4D3D3" },
  { codigo: "25", nombre: "Fucsia", hex: "#DB2777" },
  { codigo: "30", nombre: "Nude", hex: "#E8C4A8" },
  { codigo: "31", nombre: "Beige", hex: "#E7DCC8" },
  { codigo: "32", nombre: "Café", hex: "#6B4226" },
  { codigo: "33", nombre: "Camel", hex: "#C19A6B" },
  { codigo: "40", nombre: "Verde", hex: "#16A34A" },
  { codigo: "41", nombre: "Verde oliva", hex: "#6B7A2E" },
  { codigo: "42", nombre: "Menta", hex: "#A7F3D0" },
  { codigo: "50", nombre: "Amarillo", hex: "#FACC15" },
  { codigo: "51", nombre: "Mostaza", hex: "#D4A017" },
  { codigo: "52", nombre: "Naranja", hex: "#F97316" },
  { codigo: "60", nombre: "Morado", hex: "#7C3AED" },
  { codigo: "61", nombre: "Lila", hex: "#C4B5FD" },
  { codigo: "90", nombre: "Multicolor" },
] as const;

/** "azul MARINO" -> el color "Azul marino" de la lista; `null` si no esta registrado. */
export function colorRegistrado<T extends { nombre: string }>(
  texto: string,
  colores: ReadonlyArray<T>,
): T | null {
  return colores.find((c) => clave(c.nombre) === clave(texto)) ?? null;
}

/** La talla como va en el SKU: "Única" -> "U", "35-40" -> "3540", "m" -> "M". */
export function tallaParaSku(talla: string): string {
  const limpia = sinTildes(talla)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return limpia === "UNICA" ? "U" : limpia;
}

/** Diseño que se asume cuando no se indica otro. */
export const DISENO_POR_DEFECTO = "Liso";

/** Diseños iniciales. El numero de cada uno en el SKU se asigna por producto. */
export const DISENOS = [DISENO_POR_DEFECTO, "Rayas", "Estampado", "Cuadros", "Lunares"] as const;

/** Clases de atributo que el panel gestiona en la tabla `atributos`. */
export const CLASES_ATRIBUTO = ["COLOR", "DISENO", "ETIQUETA"] as const;
export type ClaseAtributo = (typeof CLASES_ATRIBUTO)[number];

/** Etiquetas iniciales: la insignia sobre la foto de la tarjeta. */
export const ETIQUETAS_PRODUCTO = ["Nuevo", "Oferta", "Más vendido"] as const;

/** Hasta cuantos diseños caben en un producto: el codigo es un solo digito. */
export const MAX_DISENOS = 9;

/**
 * Numero del diseño dentro del producto. Los diseños se cuentan por producto,
 * no en toda la tienda: el "2" de un boxer y el "2" de un brasier no chocan
 * porque el codigo del modelo ya los separa. Si el producto ya tiene ese
 * diseño se reutiliza su numero; si no, el siguiente. `null` = ya no caben.
 */
export function codigoDeDiseno(
  existentes: ReadonlyArray<{ diseno: string; disenoCodigo: number }>,
  diseno: string,
): number | null {
  const igual = existentes.find((e) => clave(e.diseno) === clave(diseno));
  if (igual) return igual.disenoCodigo;
  const siguiente = existentes.reduce((a, e) => Math.max(a, e.disenoCodigo), 0) + 1;
  return siguiente > MAX_DISENOS ? null : siguiente;
}

/** SKU de una variante: `BX012` + `M` + color `11` + diseño `2` -> "BX012-M-112". */
export function skuDeVariante(
  codigoProducto: string,
  talla: string,
  codigoColor: string,
  disenoCodigo: number,
): string {
  return `${codigoProducto}-${tallaParaSku(talla)}-${codigoColor}${disenoCodigo}`;
}

/** `"BX008"` -> `"BX"`; `null` si no tiene la forma de un codigo de modelo. */
export function tipoDeCodigo(codigo: string | null): string | null {
  const encontrado = codigo === null ? null : /^([A-Z]{2})\d+$/.exec(codigo);
  return encontrado?.[1] ?? null;
}

/** Cuantas variantes se crean de una vez como maximo: 10 tallas por 6 colores. */
export const MAX_VARIANTES_POR_LOTE = 60;

/**
 * Variantes que salen de cruzar tallas y colores con un diseño. Quita las
 * repetidas dentro de la seleccion ("m" y "M") y las que el producto ya tiene,
 * y dice cuantas se saltaron para avisarlo.
 */
export function combinacionesDeVariantes(
  existentes: ReadonlyArray<{ talla: string; color: string; diseno: string }>,
  pedido: { tallas: ReadonlyArray<string>; colores: ReadonlyArray<string>; diseno: string },
): { nuevas: { talla: string; color: string; diseno: string }[]; yaExistian: number } {
  // Se queda la primera forma escrita: "M" antes que "m".
  const unicas = (lista: ReadonlyArray<string>) => {
    const vistas = new Map<string, string>();
    for (const texto of lista)
      if (!vistas.has(clave(texto))) vistas.set(clave(texto), texto.trim());
    return [...vistas.values()];
  };
  const nuevas: { talla: string; color: string; diseno: string }[] = [];
  let yaExistian = 0;
  for (const talla of unicas(pedido.tallas)) {
    for (const color of unicas(pedido.colores)) {
      const variante = { talla, color, diseno: pedido.diseno };
      if (varianteRepetida(existentes, variante)) yaExistian++;
      else nuevas.push(variante);
    }
  }
  return { nuevas, yaExistian };
}

export interface RequisitoPublicacion {
  id: "precio" | "variante" | "foto" | "resumen";
  texto: string;
  cumplido: boolean;
  /** Sin los obligatorios el producto no se puede mostrar en la tienda. */
  obligatorio: boolean;
}

/**
 * Lo que un producto necesita antes de mostrarse. Precio y una variante a la
 * venta son obligatorios: sin ellos la ficha no deja comprar. La foto propia
 * y el resumen solo se recomiendan, porque la imagen de relleno ya existe.
 */
export function requisitosDePublicacion(producto: {
  precio: number | null;
  variantes: ReadonlyArray<{ activo: boolean; stock: number }>;
  fotosPropias: number;
  descripcionCorta: string;
}): RequisitoPublicacion[] {
  return [
    {
      id: "precio",
      texto: "Tiene precio",
      cumplido: producto.precio !== null && producto.precio > 0,
      obligatorio: true,
    },
    {
      id: "variante",
      texto: "Al menos una variante visible con stock",
      cumplido: producto.variantes.some((v) => v.activo && v.stock > 0),
      obligatorio: true,
    },
    {
      id: "foto",
      texto: "Foto propia (no la de relleno)",
      cumplido: producto.fotosPropias > 0,
      obligatorio: false,
    },
    {
      id: "resumen",
      texto: "Resumen para la tarjeta del listado",
      cumplido: producto.descripcionCorta.trim() !== "",
      obligatorio: false,
    },
  ];
}

/** `true` si se cumplen todos los obligatorios. */
export function listoParaPublicar(requisitos: ReadonlyArray<RequisitoPublicacion>): boolean {
  return requisitos.every((r) => !r.obligatorio || r.cumplido);
}

/** "negro", " Negro " y "NEGRO" son el mismo color; "Única" y "unica", la misma talla. */
function clave(texto: string): string {
  return sinTildes(texto).trim().toLowerCase();
}

/** "#1e2a4a" -> `true`: la muestra de un color, seis digitos hex. */
export function esHex(texto: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(texto);
}

/** `true` si dos nombres son el mismo valor: "Más vendido" y "mas VENDIDO". */
export function mismoNombre(a: string, b: string): boolean {
  return clave(a) === clave(b);
}

/** `true` si ya hay una variante con esa talla, ese color y ese diseño. */
export function varianteRepetida(
  existentes: ReadonlyArray<{ talla: string; color: string; diseno: string }>,
  nueva: { talla: string; color: string; diseno: string },
): boolean {
  return existentes.some(
    (v) =>
      clave(v.talla) === clave(nueva.talla) &&
      clave(v.color) === clave(nueva.color) &&
      clave(v.diseno) === clave(nueva.diseno),
  );
}
