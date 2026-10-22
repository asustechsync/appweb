import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { COOKIE_SESION, sesionDesdeToken } from "@appweb/api";
import { puede } from "@appweb/core";

import { etiquetas, etiquetasDeProducto } from "@/lib/cache";

const SLUG = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const esquema = z.object({
  productos: z.array(z.object({ slug: SLUG, slugCategoria: SLUG })).max(100),
  /** Cambio QUE productos existen (alta, baja, slug nuevo). */
  catalogo: z.boolean().default(false),
  /** Cambiaron las tarifas de envio: las lee el checkout. */
  envios: z.boolean().default(false),
  /** Cambiaron los banners del carrusel o la fila de marcas. */
  portada: z.boolean().default(false),
  /** Cambio el arbol de categorias: el menu de la cabecera. */
  navegacion: z.boolean().default(false),
});

/**
 * Regenera la ficha, la categoria y la portada de los productos que cambio el
 * panel: stock (pedidos, ingresos, mermas) o datos (precio, nombre, alta), y
 * las tarifas de envio que lee el checkout.
 * Las etiquetas salen de `etiquetasDeProducto`, nunca escritas a mano.
 */
export async function POST(peticion: Request) {
  const almacen = await cookies();
  const sesion = sesionDesdeToken(almacen.get(COOKIE_SESION)?.value);
  if (!sesion) return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });

  const permitido = [
    "cambiar_estado_pedido",
    "ajustar_stock",
    "gestionar_productos",
    "moderar_resenas",
  ] as const;
  if (!permitido.some((accion) => puede(sesion.rol, accion))) {
    return NextResponse.json({ error: "No tienes permiso." }, { status: 403 });
  }

  const analizado = esquema.safeParse(await peticion.json().catch(() => null));
  if (!analizado.success) {
    return NextResponse.json({ error: "Lista de productos inválida." }, { status: 400 });
  }

  const porRegenerar = new Set(
    analizado.data.productos.flatMap((p) => etiquetasDeProducto(p.slug, p.slugCategoria)),
  );
  if (analizado.data.catalogo) porRegenerar.add(etiquetas.catalogo());
  if (analizado.data.navegacion) {
    if (!puede(sesion.rol, "gestionar_productos")) {
      return NextResponse.json({ error: "No tienes permiso." }, { status: 403 });
    }
    porRegenerar.add(etiquetas.navegacion());
  }
  if (analizado.data.envios) {
    if (!puede(sesion.rol, "gestionar_ajustes")) {
      return NextResponse.json({ error: "No tienes permiso." }, { status: 403 });
    }
    porRegenerar.add(etiquetas.envios());
  }
  if (analizado.data.portada) {
    if (!puede(sesion.rol, "gestionar_ajustes")) {
      return NextResponse.json({ error: "No tienes permiso." }, { status: 403 });
    }
    porRegenerar.add(etiquetas.portada());
  }
  for (const etiqueta of porRegenerar) revalidateTag(etiqueta, "max");

  return NextResponse.json({ ok: true, etiquetas: porRegenerar.size });
}
