import { cacheLife, cacheTag } from "next/cache";

import { resolverDisponibilidad, resolverPrecio } from "@appweb/core";
import { prisma } from "@appweb/db";

import { etiquetas } from "./cache";

export interface ProductoDeRejilla {
  slug: string;
  nombre: string;
  marca: string | null;
  imagenUrl: string;
  precio: number;
  precioLista: number | null;
  descuentoPct: number | null;
  etiqueta: string | null;
  disponible: boolean;
}

/**
 * Productos en oferta para la portada. Etiqueta `portada`: se invalida
 * cuando el panel cambia el precio o el precioLista de cualquier producto.
 *
 * `resolverPrecio` y `resolverDisponibilidad` de @appweb/core deciden si es
 * oferta de verdad y si hay stock — las mismas funciones que usara la
 * ficha, para no calcular lo mismo dos veces con resultados distintos.
 */
export async function productosEnOferta(limite = 8): Promise<ProductoDeRejilla[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(etiquetas.portada());

  const productos = await prisma.producto.findMany({
    where: { activo: true, precioLista: { not: null } },
    orderBy: { creadoEn: "desc" },
    take: limite,
    include: {
      imagenes: { orderBy: { orden: "asc" }, take: 1 },
      variantes: { select: { stock: true, activa: true, talla: true, color: true } },
    },
  });

  const resueltos = productos.map((p): ProductoDeRejilla | null => {
    const precio = resolverPrecio({
      precio: Number(p.precio),
      precioLista: p.precioLista !== null ? Number(p.precioLista) : null,
    });

    if (!precio.enOferta) return null;

    const disponibilidad = resolverDisponibilidad(p.variantes);

    return {
      slug: p.slug,
      nombre: p.nombre,
      marca: p.marca,
      imagenUrl: p.imagenes[0]?.url ?? "",
      precio: precio.precio,
      precioLista: precio.precioLista,
      descuentoPct: precio.descuentoPct,
      etiqueta: p.etiqueta,
      disponible: disponibilidad.hayStock,
    };
  });

  return resueltos.filter((p): p is ProductoDeRejilla => p !== null);
}
