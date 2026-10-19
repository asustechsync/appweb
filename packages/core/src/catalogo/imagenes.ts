/**
 * Fotos de producto: que se acepta, donde se guarda y cuando se reemplaza la
 * imagen de relleno. El almacenamiento en si es un puerto
 * (`puertos/almacen-archivos.ts`); aqui solo las reglas.
 */

import { IMAGEN_DEMO } from "./gestion";

/** Formatos que muestran todos los navegadores, con su extension. */
export const TIPOS_IMAGEN = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type TipoImagen = keyof typeof TIPOS_IMAGEN;

/** 5 MB: una foto de celular en buena calidad entra; un RAW de camara, no. */
export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;

/** Mas de ocho fotos no las mira nadie y hacen pesada la ficha. */
export const MAX_IMAGENES_POR_PRODUCTO = 8;

export type RechazoImagen = "tipo" | "tamano" | "vacia" | "demasiadas";

export function revisarImagen(archivo: {
  tipo: string;
  bytes: number;
  /** Fotos propias que el producto ya tiene (sin contar la de relleno). */
  yaTiene: number;
}): RechazoImagen | null {
  if (!(archivo.tipo in TIPOS_IMAGEN)) return "tipo";
  if (archivo.bytes === 0) return "vacia";
  if (archivo.bytes > MAX_BYTES_IMAGEN) return "tamano";
  if (archivo.yaTiene >= MAX_IMAGENES_POR_PRODUCTO) return "demasiadas";
  return null;
}

export function mensajeDeRechazoImagen(rechazo: RechazoImagen): string {
  switch (rechazo) {
    case "tipo":
      return "Usa una foto JPG, PNG o WEBP.";
    case "vacia":
      return "El archivo está vacío.";
    case "tamano":
      return "La foto pesa más de 5 MB. Redúcela e inténtalo de nuevo.";
    case "demasiadas":
      return `Un producto puede tener hasta ${MAX_IMAGENES_POR_PRODUCTO} fotos.`;
  }
}

/**
 * Ruta dentro del almacen: carpeta por producto y nombre unico, para que una
 * foto nueva nunca pise a otra ni quede tapada por la cache del navegador.
 * `productos/boxer-clasico/m2x8k1.webp`
 */
export function rutaDeImagen(slugProducto: string, tipo: TipoImagen, unico: string): string {
  return `productos/${slugProducto}/${unico}.${TIPOS_IMAGEN[tipo]}`;
}

/** La imagen de relleno con la que nace todo producto. Se quita al subir la primera foto. */
export function esImagenDemo(url: string): boolean {
  return url === IMAGEN_DEMO;
}

/**
 * La URL de la foto para mostrarla, o `""` si el producto no tiene ninguna.
 * La imagen de relleno se muestra como cualquier otra: mientras no se suba
 * una foto propia, el catalogo enseña la de demo. La tienda pinta
 * "Sin imagen" solo cuando llega `""`.
 */
export function urlDeFoto(url: string | null | undefined): string {
  return url ?? "";
}
