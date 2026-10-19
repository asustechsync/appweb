import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COOKIE_SESION } from "@appweb/api";
import { URL_TIENDA } from "@appweb/api/urls";

/**
 * Reenvía a la tienda la lista de productos cuyo stock cambió: la caché que
 * hay que invalidar vive en la aplicación web, no aquí. La tienda valida la
 * sesión y la lista por su cuenta.
 */
export async function POST(peticion: Request) {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (!token) return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });

  const respuesta = await fetch(`${URL_TIENDA}/api/panel/revalidar-catalogo`, {
    method: "POST",
    headers: {
      cookie: `${COOKIE_SESION}=${encodeURIComponent(token)}`,
      "content-type": "application/json",
    },
    body: await peticion.text(),
    cache: "no-store",
  });

  return NextResponse.json(await respuesta.json(), { status: respuesta.status });
}
