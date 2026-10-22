/**
 * Arbol de categorias: una categoria puede colgar de otra ("Hombres › Boxers").
 *
 * La base no impide los ciclos (A dentro de B dentro de A): el menu de la
 * tienda se quedaria dando vueltas. Esta regla los rechaza antes de guardar.
 */

/** ¿Poner `id` dentro de `padreId` crea un ciclo? `padres` = id -> su padre. */
export function creariaCiclo(
  id: string,
  padreId: string | null,
  padres: ReadonlyMap<string, string | null>,
): boolean {
  let actual = padreId;
  const vistos = new Set<string>();
  while (actual !== null) {
    if (actual === id || vistos.has(actual)) return true;
    vistos.add(actual);
    actual = padres.get(actual) ?? null;
  }
  return false;
}
