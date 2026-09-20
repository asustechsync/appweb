/**
 * Opciones de compra de un producto: que talla se puede elegir y, dentro de
 * esa talla, que colores quedan.
 *
 * Separado de `resolverDisponibilidad`, que responde "¿se puede comprar?"
 * para un listado. Esto responde "¿que puedo elegir?" para una ficha, que es
 * otra pregunta: un producto puede tener stock y aun asi no tener el color
 * negro en talla S.
 *
 * Vive aqui y no en el selector de la ficha porque la app movil ofrece las
 * mismas opciones. Si la regla de "este color no esta en esta talla" se
 * escribiera en el componente, la movil tendria que reescribirla y las dos
 * versiones se irian separando.
 */

export interface VarianteElegible {
  talla: string;
  color: string;
  stock: number;
}

export interface OpcionDeTalla {
  talla: string;
  /** Solo los colores que tienen stock en esa talla. Nunca vacio. */
  colores: string[];
}

/** Tallas de letra en su orden natural; lo demas se ordena por numero. */
const ORDEN_LETRAS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/**
 * Clave de orden de una talla: [grupo, numero, texto].
 *
 * Ordenar tallas alfabeticamente da "L, M, S", que no es como se compra ropa.
 * Los cuatro grupos son los que usa el catalogo: letras (S-XL), meses de bebe
 * (3M, 6M, 12M), numeros de niño (6, 8, 10) y talla unica al final.
 */
function claveDeOrden(talla: string): [number, number, string] {
  const normalizada = talla.trim().toUpperCase();

  const porLetra = ORDEN_LETRAS.indexOf(normalizada);
  if (porLetra !== -1) return [0, porLetra, normalizada];

  const meses = /^(\d+)\s*M$/.exec(normalizada);
  if (meses?.[1] !== undefined) return [1, Number(meses[1]), normalizada];

  if (/^\d+$/.test(normalizada)) return [2, Number(normalizada), normalizada];

  return [3, 0, normalizada];
}

function compararTallas(a: string, b: string): number {
  const [grupoA, numeroA, textoA] = claveDeOrden(a);
  const [grupoB, numeroB, textoB] = claveDeOrden(b);

  if (grupoA !== grupoB) return grupoA - grupoB;
  if (numeroA !== numeroB) return numeroA - numeroB;
  return textoA.localeCompare(textoB, "es");
}

/**
 * Tallas con stock y sus colores, en el orden en que se compra ropa: S antes
 * que M, 6M antes que 12M. Los colores quedan como llegan de la consulta.
 *
 * Una talla sin ningun color con stock no entra: ofrecerla llevaria al
 * comprador a un callejon sin salida.
 */
export function opcionesDeCompra(variantes: VarianteElegible[]): OpcionDeTalla[] {
  const porTalla = new Map<string, string[]>();

  for (const variante of variantes) {
    if (variante.stock <= 0) continue;

    const colores = porTalla.get(variante.talla);
    if (colores === undefined) {
      porTalla.set(variante.talla, [variante.color]);
      continue;
    }
    if (!colores.includes(variante.color)) colores.push(variante.color);
  }

  return [...porTalla]
    .sort(([tallaA], [tallaB]) => compararTallas(tallaA, tallaB))
    .map(([talla, colores]) => ({ talla, colores }));
}
