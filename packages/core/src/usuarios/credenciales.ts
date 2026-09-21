/**
 * Hash de la clave del usuario.
 *
 * `scrypt` en vez de una libreria externa: viene en Node, no exige compilar
 * nada nativo y con los parametros de abajo es tan lento de fuerza bruta como
 * bcrypt. El hash se guarda como `salt:hash`, los dos en hex, en el mismo
 * campo `Usuario.clave` que antes solo pensaba en texto plano.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LARGO_SAL = 16;
const LARGO_HASH = 64;

export function hashClave(clave: string): string {
  const sal = randomBytes(LARGO_SAL);
  const hash = scryptSync(clave, sal, LARGO_HASH);
  return `${sal.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Compara la clave escrita contra el hash guardado.
 *
 * `timingSafeEqual` para no filtrar por cuanto tarda la respuesta cuanto del
 * hash acerto. Si el hash guardado no tiene el formato esperado (datos de
 * antes de este cambio, o corrupcion) la clave se da por invalida en vez de
 * lanzar.
 */
export function verificarClave(clave: string, hashGuardado: string): boolean {
  const [salHex, hashHex] = hashGuardado.split(":");
  if (!salHex || !hashHex) return false;

  const sal = Buffer.from(salHex, "hex");
  const hashEsperado = Buffer.from(hashHex, "hex");
  if (hashEsperado.length !== LARGO_HASH) return false;

  const hashCalculado = scryptSync(clave, sal, LARGO_HASH);
  return timingSafeEqual(hashCalculado, hashEsperado);
}
