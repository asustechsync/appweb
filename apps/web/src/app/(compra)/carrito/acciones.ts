"use server";

import { varianteParaCarrito, type VarianteDeCarrito } from "@/lib/consultas";

/**
 * Resuelve las variantes que el navegador tiene guardadas en su carrito.
 *
 * Existe porque el carrito vive en el navegador: el servidor no sabe que hay
 * dentro hasta que la isla cliente monta y le pasa los ids. Cada variante se
 * lee de una funcion cacheada, no de un join en vivo.
 *
 * Las que ya no existen, o cuyo producto se desactivo, vuelven fuera de la
 * lista: la isla las descarta del carrito guardado al recibir la respuesta.
 */
export async function resolverLineasDelCarrito(
  varianteIds: string[],
): Promise<VarianteDeCarrito[]> {
  if (varianteIds.length === 0) return [];

  // Tope defensivo: la entrada viene del navegador y podria traer miles de ids.
  const ids = [...new Set(varianteIds)].slice(0, 50);

  const variantes = await Promise.all(ids.map((id) => varianteParaCarrito(id)));

  return variantes.filter((variante): variante is VarianteDeCarrito => variante !== null);
}
