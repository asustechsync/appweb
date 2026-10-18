/**
 * Alta y edicion del catalogo desde el panel: slug, SKU y variantes.
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

/** SKU de una variante: slug + talla + color en mayusculas, sin tildes. */
export function skuDeVariante(slugProducto: string, talla: string, color: string): string {
  return [slugProducto, talla, color]
    .map((parte) => slugDesdeTexto(parte))
    .filter(Boolean)
    .join("-")
    .toUpperCase();
}

/** "negro", " Negro " y "NEGRO" son el mismo color; "Única" y "unica", la misma talla. */
function clave(texto: string): string {
  return sinTildes(texto).trim().toLowerCase();
}

/** `true` si ya hay una variante con esa talla y ese color. */
export function varianteRepetida(
  existentes: ReadonlyArray<{ talla: string; color: string }>,
  nueva: { talla: string; color: string },
): boolean {
  return existentes.some(
    (v) => clave(v.talla) === clave(nueva.talla) && clave(v.color) === clave(nueva.color),
  );
}
