/**
 * Codigo visible del pedido: el que el cliente ve y dice por telefono.
 *
 * Formato AAMMDD-NNNN: la fecha ordena los pedidos a simple vista y el
 * numero es el correlativo del dia (0001, 0002...). Es corto, solo lleva
 * digitos y no se repite: cada pedido toma el numero siguiente al ultimo del
 * dia. Pasado el 9999 el numero simplemente gana un digito.
 */

/** Digitos minimos del correlativo: "0042". */
const DIGITOS = 4;

/** Inicio del codigo de un dia: "261023-". Sirve para buscar el ultimo. */
export function prefijoCodigoPedido(fecha: Date = new Date()): string {
  const aa = String(fecha.getFullYear() % 100).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${aa}${mm}${dd}-`;
}

/**
 * El codigo que sigue al `ultimo` del dia ("261023-0041" -> "261023-0042").
 * Sin `ultimo` (primer pedido del dia) arranca en 0001.
 */
export function siguienteCodigoPedido(fecha: Date, ultimo: string | null): string {
  const prefijo = prefijoCodigoPedido(fecha);
  const numero = ultimo?.startsWith(prefijo) ? Number(ultimo.slice(prefijo.length)) : 0;
  const siguiente = (Number.isInteger(numero) ? numero : 0) + 1;
  return `${prefijo}${String(siguiente).padStart(DIGITOS, "0")}`;
}

/**
 * El codigo para listas donde ya se sabe que es un pedido. Los codigos
 * anteriores ("PED-20261023-F52U") pierden su prefijo -> "20261023-F52U"; el
 * formato actual y cualquier otro quedan igual.
 */
export function codigoCorto(codigo: string): string {
  return /^PED-(\d{6,8}-\w+)$/.exec(codigo)?.[1] ?? codigo;
}
