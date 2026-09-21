import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COOKIE_SESION } from "@appweb/api";

/** Cerrar sesion desde el panel. La cookie es la misma que usa la tienda. */
export async function DELETE() {
  const almacen = await cookies();
  almacen.delete(COOKIE_SESION);
  return NextResponse.json({ ok: true });
}
