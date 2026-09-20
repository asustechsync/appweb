/**
 * El carrito guardado: que lineas hay y cuantas unidades de cada una.
 *
 * Guarda lo minimo — varianteId y cantidad — y nada mas. Ni precio, ni nombre,
 * ni imagen: eso cambia en la base y un carrito de hace una semana mostraria
 * cifras viejas. El precio y el stock se vuelven a leer del servidor en cada
 * visita al carrito.
 *
 * No sabe donde se guarda. La web lo mete en localStorage y la app movil en
 * AsyncStorage; las dos usan estas mismas funciones para modificarlo, asi que
 * "sumar una unidad" significa lo mismo en los dos sitios.
 */

export interface LineaGuardada {
  varianteId: string;
  cantidad: number;
}

/** Tope por linea. Coincide con `esquemaLineaCarrito` de tipos/. */
export const MAX_POR_LINEA = 20;

function acotar(cantidad: number): number {
  return Math.min(Math.max(Math.trunc(cantidad), 1), MAX_POR_LINEA);
}

/**
 * Suma unidades de una variante. Si ya estaba en el carrito no duplica la
 * linea: acumula sobre la existente, que es lo que espera quien vuelve a la
 * ficha y añade otra vez.
 */
export function agregarAlCarrito(
  lineas: LineaGuardada[],
  varianteId: string,
  cantidad = 1,
): LineaGuardada[] {
  const existente = lineas.find((linea) => linea.varianteId === varianteId);

  if (existente === undefined) {
    return [...lineas, { varianteId, cantidad: acotar(cantidad) }];
  }

  return lineas.map((linea) =>
    linea.varianteId === varianteId
      ? { ...linea, cantidad: acotar(linea.cantidad + cantidad) }
      : linea,
  );
}

/** Fija la cantidad de una linea. Bajar a cero la quita. */
export function cambiarCantidad(
  lineas: LineaGuardada[],
  varianteId: string,
  cantidad: number,
): LineaGuardada[] {
  if (cantidad < 1) return quitarDelCarrito(lineas, varianteId);

  return lineas.map((linea) =>
    linea.varianteId === varianteId ? { ...linea, cantidad: acotar(cantidad) } : linea,
  );
}

export function quitarDelCarrito(
  lineas: LineaGuardada[],
  varianteId: string,
): LineaGuardada[] {
  return lineas.filter((linea) => linea.varianteId !== varianteId);
}

/** Unidades totales. Es lo que muestra el globo del icono del carrito. */
export function unidadesEn(lineas: LineaGuardada[]): number {
  return lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
}

/**
 * Convierte lo que haya en el almacenamiento en lineas utilizables.
 *
 * Lo guardado es texto que el usuario puede editar a mano, y una version vieja
 * de la app pudo guardar otra forma. Todo lo que no encaje se descarta en
 * silencio: es preferible un carrito incompleto a una pantalla rota.
 */
export function normalizarCarrito(valor: unknown): LineaGuardada[] {
  if (!Array.isArray(valor)) return [];

  const vistas = new Set<string>();
  const lineas: LineaGuardada[] = [];

  for (const entrada of valor) {
    if (typeof entrada !== "object" || entrada === null) continue;

    const { varianteId, cantidad } = entrada as Record<string, unknown>;
    if (typeof varianteId !== "string" || varianteId === "") continue;
    if (typeof cantidad !== "number" || !Number.isFinite(cantidad) || cantidad < 1) continue;
    if (vistas.has(varianteId)) continue;

    vistas.add(varianteId);
    lineas.push({ varianteId, cantidad: acotar(cantidad) });
  }

  return lineas;
}
