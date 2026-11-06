/**
 * Limites de los formularios publicos (ingreso, registro, recuperacion,
 * reclamos).
 *
 * Viven aqui y no en cada app porque la tienda web (server actions) y la app
 * movil (tRPC) corren en el mismo servidor: si cada una tuviera su contador,
 * quien prueba claves tendria el doble de intentos cambiando de puerta.
 */

import { LimiteDeIntentos } from "@appweb/core";

const MINUTO = 60_000;

// Los limites por correo son la defensa real: frenan a quien ataca una cuenta sin
// tocar a nadie mas. Los de IP son holgados a proposito: en Peru los operadores
// moviles (CGNAT) y los wifi compartidos ponen a cientos de clientes detras de
// una misma IP, y un tope bajo bloquearia a gente que no hizo nada.
export const limites = {
  /** Contraseñas fallidas por correo: frena probar claves contra una cuenta. */
  ingresoPorCorreo: new LimiteDeIntentos(5, 15 * MINUTO),
  /** Intentos de ingreso por IP: solo frena un ataque masivo desde un sitio. */
  ingresoPorIp: new LimiteDeIntentos(100, 15 * MINUTO),
  registroPorIp: new LimiteDeIntentos(20, 15 * MINUTO),
  recuperacionPorIp: new LimiteDeIntentos(20, 15 * MINUTO),
  recuperacionPorCorreo: new LimiteDeIntentos(3, 15 * MINUTO),
  reclamoPorIp: new LimiteDeIntentos(5, 60 * MINUTO),
};

/**
 * IP de quien hace el pedido. Detras de un proxy (Vercel, Cloudflare) llega en
 * `x-forwarded-for`, y la primera de la lista es la del visitante.
 */
export function ipDeCabeceras(cabeceras: Headers): string {
  const reenviada = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || cabeceras.get("x-real-ip") || "desconocida";
}
