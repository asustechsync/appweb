import { cacheLife, cacheTag } from "next/cache";

import { resolverPrecio } from "@appweb/core";
import { prisma } from "@appweb/db";

import { etiquetas } from "./cache";

export interface ProductoDeRejilla {
  slug: string;
  nombre: string;
  imagenUrl: string;
  precio: number;
  precioLista: number | null;
  descuentoPct: number | null;
  etiqueta: string | null;
}

/**
 * Productos en oferta para la portada. Etiqueta `portada`: se invalida
 * cuando el panel cambia el precio o el precioLista de cualquier producto.
 *
 * `resolverPrecio` de @appweb/core decide si es oferta de verdad — la misma
 * funcion que usa la ficha, para no mostrar cifras distintas en dos sitios.
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
    },
  });

  const resueltos = productos.map((p): ProductoDeRejilla | null => {
    const precio = resolverPrecio({
      precio: Number(p.precio),
      precioLista: p.precioLista !== null ? Number(p.precioLista) : null,
    });

    if (!precio.enOferta) return null;

    return {
      slug: p.slug,
      nombre: p.nombre,
      imagenUrl: p.imagenes[0]?.url ?? "",
      precio: precio.precio,
      precioLista: precio.precioLista,
      descuentoPct: precio.descuentoPct,
      etiqueta: p.etiqueta,
    };
  });

  return resueltos.filter((p): p is ProductoDeRejilla => p !== null);
}
