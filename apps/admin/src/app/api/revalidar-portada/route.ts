import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COOKIE_SESION } from "@appweb/api";

const URL_TIENDA = process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000";

/** Reenvía la invalidación a la aplicación web, cuya caché sirve la portada. */
export async function POST() {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (!token) return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });

  const respuesta = await fetch(`${URL_TIENDA}/api/panel/revalidar-portada`, {
    method: "POST",
    headers: { cookie: `${COOKIE_SESION}=${encodeURIComponent(token)}` },
    cache: "no-store",
  });

  return NextResponse.json(await respuesta.json(), { status: respuesta.status });
}
