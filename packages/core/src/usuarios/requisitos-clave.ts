/**
 * Requisitos de una contraseña nueva. Una sola lista: la validan el esquema
 * de registro y el indicador del formulario, en web, panel y app movil.
 *
 * Los obligatorios bloquean el registro; el extra (`obligatorio: false`) solo
 * sube el nivel del indicador: un simbolo o una clave larga la hacen mas segura,
 * pero no se exige.
 */
export interface RequisitoClave {
  id: "largo" | "mayuscula" | "numero" | "extra";
  texto: string;
  obligatorio: boolean;
  cumple: (clave: string) => boolean;
}

/** En orden de importancia: el indicador enciende sus tramos en esta secuencia. */
export const TODOS_LOS_REQUISITOS_CLAVE: readonly RequisitoClave[] = [
  { id: "mayuscula", texto: "Mayúscula", obligatorio: true, cumple: (c) => /[A-Z]/.test(c) },
  { id: "numero", texto: "Número", obligatorio: true, cumple: (c) => /\d/.test(c) },
  { id: "largo", texto: "8 caracteres", obligatorio: true, cumple: (c) => c.length >= 8 },
  { id: "extra", texto: "Símbolo o 12 caracteres", obligatorio: false, cumple: (c) => c.length >= 12 || /[^A-Za-z0-9\s]/.test(c) },
];

/** Los que el esquema exige para crear la cuenta. */
export const REQUISITOS_CLAVE = TODOS_LOS_REQUISITOS_CLAVE.filter((r) => r.obligatorio);

/** Cada requisito con su estado para la clave dada. */
export function evaluarClave(
  clave: string,
): { id: string; texto: string; obligatorio: boolean; cumplido: boolean }[] {
  return TODOS_LOS_REQUISITOS_CLAVE.map(({ id, texto, obligatorio, cumple }) => ({
    id,
    texto,
    obligatorio,
    cumplido: cumple(clave),
  }));
}
