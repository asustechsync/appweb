/**
 * Para quien es una prenda. Atributo del producto, como la talla o el color:
 * una media unisex se registra una vez y sale en Hombre y en Mujer.
 *
 * Las categorias de publico ("Hombre") no guardan productos: listan los que
 * tienen su publico y filtran por la categoria de tipo ("Medias") de cada uno.
 */

export const PUBLICOS = ["HOMBRE", "MUJER", "NINOS", "BEBES"] as const;

export type Publico = (typeof PUBLICOS)[number];

export const ETIQUETA_PUBLICO: Record<Publico, string> = {
  HOMBRE: "Hombre",
  MUJER: "Mujer",
  NINOS: "Niños",
  BEBES: "Bebés",
};

/** Los publicos sin repetir y en el orden de `PUBLICOS`, el del menu. */
export function ordenarPublicos(publicos: readonly Publico[]): Publico[] {
  return PUBLICOS.filter((p) => publicos.includes(p));
}
