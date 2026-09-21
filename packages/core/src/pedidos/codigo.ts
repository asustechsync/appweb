/**
 * Codigo visible del pedido: el que el cliente ve y dice por telefono.
 *
 * Formato PED-AAAAMMDD-XXXX. La fecha ordena los pedidos a simple vista en el
 * panel; los cuatro caracteres al azar evitan que dos pedidos del mismo dia
 * choquen sin tener que consultar la base para saber cual es el siguiente
 * numero.
 */

import { randomBytes } from "node:crypto";

const ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin 0/O/1/I: no se confunden al leerlos en voz alta

export function generarCodigoPedido(fecha: Date = new Date()): string {
  const aaaa = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");

  const azar = randomBytes(4);
  let sufijo = "";
  for (const byte of azar) {
    sufijo += ALFABETO[byte % ALFABETO.length];
  }

  return `PED-${aaaa}${mm}${dd}-${sufijo}`;
}
