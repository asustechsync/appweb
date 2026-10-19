import { headers } from "next/headers";

import { LimiteDeIntentos } from "@appweb/core";

/**
 * Limites de los formularios publicos. Solo se usan en server actions, que ya
 * son dinamicas: leer `headers()` aqui no vuelve dinamica ninguna pagina.
 */

const MINUTO = 60_000;

export const limites = {
  /** Contraseñas fallidas por correo: frena probar claves contra una cuenta. */
  ingresoPorCorreo: new LimiteDeIntentos(5, 15 * MINUTO),
  /** Intentos de ingreso por IP: frena probar muchas cuentas desde un sitio. */
  ingresoPorIp: new LimiteDeIntentos(20, 15 * MINUTO),
  registroPorIp: new LimiteDeIntentos(5, 60 * MINUTO),
  recuperacionPorIp: new LimiteDeIntentos(5, 60 * MINUTO),
  recuperacionPorCorreo: new LimiteDeIntentos(3, 60 * MINUTO),
  reclamoPorIp: new LimiteDeIntentos(5, 60 * MINUTO),
};

/**
 * IP de quien hace el pedido. Detras de un proxy (Vercel, Cloudflare) llega en
 * `x-forwarded-for`, y la primera de la lista es la del visitante.
 */
export async function ipDelCliente(): Promise<string> {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || cabeceras.get("x-real-ip") || "desconocida";
}
