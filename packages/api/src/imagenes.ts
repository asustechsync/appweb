/**
 * Alta de fotos de producto. Vive fuera de tRPC porque el archivo llega como
 * `multipart/form-data` (un route handler del panel lo recibe y llama aqui);
 * quitar y ordenar si van por tRPC, en rutas/panel/productos.ts.
 */

import { randomUUID } from "node:crypto";

import {
  esImagenDemo,
  mensajeDeRechazoImagen,
  revisarImagen,
  rutaDeImagen,
  type TipoImagen,
} from "@appweb/core";
import type { prisma as Cliente } from "@appweb/db";

import { almacen } from "./almacen";
import type { ProductoTocado } from "./stock";

export type ResultadoSubida =
  | { ok: true; imagen: { id: string; url: string; alt: string | null }; revalidar: ProductoTocado }
  | { ok: false; error: string; estado: 400 | 404 | 502 };

/**
 * Guarda la foto en el almacen y la agrega al final de la galeria. La primera
 * foto propia reemplaza a la imagen de relleno con la que nace el producto.
 */
export async function subirImagenProducto(
  prisma: typeof Cliente,
  datos: { productoId: string; contenido: Uint8Array<ArrayBuffer>; tipo: string },
): Promise<ResultadoSubida> {
  const producto = await prisma.producto.findUnique({
    where: { id: datos.productoId },
    select: {
      id: true,
      slug: true,
      nombre: true,
      categoria: { select: { slug: true } },
      imagenes: { select: { id: true, url: true, orden: true } },
    },
  });
  if (producto === null) return { ok: false, error: "Ese producto no existe.", estado: 404 };

  const propias = producto.imagenes.filter((i) => !esImagenDemo(i.url));
  const rechazo = revisarImagen({
    tipo: datos.tipo,
    bytes: datos.contenido.byteLength,
    yaTiene: propias.length,
  });
  if (rechazo) return { ok: false, error: mensajeDeRechazoImagen(rechazo), estado: 400 };

  const ruta = rutaDeImagen(producto.slug, datos.tipo as TipoImagen, randomUUID().slice(0, 12));
  let url: string;
  try {
    ({ url } = await almacen.subir(ruta, datos.contenido, datos.tipo));
  } catch (error) {
    console.error("Subida de foto fallida:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo guardar la foto.",
      estado: 502,
    };
  }

  const orden = propias.reduce((maximo, i) => Math.max(maximo, i.orden + 1), 0);
  const [, imagen] = await prisma.$transaction([
    prisma.imagenProducto.deleteMany({
      where: {
        productoId: producto.id,
        url: { in: producto.imagenes.filter((i) => esImagenDemo(i.url)).map((i) => i.url) },
      },
    }),
    prisma.imagenProducto.create({
      data: { productoId: producto.id, url, alt: producto.nombre, orden },
      select: { id: true, url: true, alt: true },
    }),
  ]);

  return {
    ok: true,
    imagen,
    revalidar: { slug: producto.slug, slugCategoria: producto.categoria.slug },
  };
}
