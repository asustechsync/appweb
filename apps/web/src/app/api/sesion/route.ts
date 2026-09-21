import { NextResponse } from "next/server";

import { borrarCookieSesion, leerSesion } from "@/lib/sesion";

/**
 * Lo unico que la isla cliente de la cabecera (`AccionesCuenta`) necesita
 * saber: si hay alguien sesionado y su nombre. Vive en una ruta aparte, no en
 * el layout, precisamente para que el layout no tenga que leer la cookie.
 */
export async function GET() {
  const sesion = await leerSesion();
  return NextResponse.json({
    sesion: sesion ? { nombre: sesion.nombre } : null,
  });
}

export async function DELETE() {
  await borrarCookieSesion();
  return NextResponse.json({ ok: true });
}
