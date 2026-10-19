import { NextResponse } from "next/server";

import { sesionDesdeToken, subirImagenProducto, tokenDeCabeceraCookie } from "@appweb/api";
import { puede } from "@appweb/core";
import { prisma } from "@appweb/db";

/**
 * Subida de una foto de producto. Es un route handler y no tRPC porque el
 * archivo llega como `multipart/form-data`. La regla (formatos, tamaño,
 * cuantas, reemplazo de la imagen de relleno) vive en `subirImagenProducto`.
 *
 * Campos: `productoId` y `archivo`.
 */
export async function POST(peticion: Request) {
  const sesion = sesionDesdeToken(tokenDeCabeceraCookie(peticion.headers.get("cookie")));
  if (sesion === null) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }
  if (!puede(sesion.rol, "gestionar_productos")) {
    return NextResponse.json({ error: "No tienes permiso." }, { status: 403 });
  }

  const formulario = await peticion.formData().catch(() => null);
  const productoId = formulario?.get("productoId");
  const archivo = formulario?.get("archivo");
  if (typeof productoId !== "string" || !(archivo instanceof File)) {
    return NextResponse.json({ error: "Falta la foto o el producto." }, { status: 400 });
  }

  const resultado = await subirImagenProducto(prisma, {
    productoId,
    contenido: new Uint8Array(await archivo.arrayBuffer()),
    tipo: archivo.type,
  });
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.estado });
  }
  return NextResponse.json({ imagen: resultado.imagen, revalidar: resultado.revalidar });
}
