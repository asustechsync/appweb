import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COOKIE_SESION, opcionesCookieSesion } from "@appweb/api";

/**
 * Cerrar sesion desde el panel. La cookie es la misma que usa la tienda, y se
 * borra con sus mismas opciones (dominio incluido) o no se borra.
 */
export async function DELETE() {
  const almacen = await cookies();
  almacen.delete({ name: COOKIE_SESION, ...opcionesCookieSesion() });
  return NextResponse.json({ ok: true });
}
