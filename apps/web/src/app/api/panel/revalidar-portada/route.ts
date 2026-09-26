import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { COOKIE_SESION, sesionDesdeToken } from "@appweb/api";
import { puede } from "@appweb/core";

import { etiquetas } from "@/lib/cache";

export async function POST() {
  const almacen = await cookies();
  const sesion = sesionDesdeToken(almacen.get(COOKIE_SESION)?.value);
  if (!sesion) return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  if (!puede(sesion.rol, "gestionar_ajustes")) {
    return NextResponse.json({ error: "No tienes permiso para actualizar la portada." }, { status: 403 });
  }

  revalidateTag(etiquetas.portada(), "max");
  return NextResponse.json({ ok: true });
}
