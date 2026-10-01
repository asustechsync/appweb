/**
 * Tipos de documento de identidad aceptados en el perfil.
 *
 * Los mismos cuatro que puede pedir un comprobante (DNI/RUC de persona
 * natural o empresa) mas los dos que cubren a un cliente extranjero.
 */
export const TIPOS_DOCUMENTO = ["DNI", "RUC", "CARNE_EXTRANJERIA", "PASAPORTE"] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const ETIQUETA_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  DNI: "DNI",
  RUC: "RUC",
  CARNE_EXTRANJERIA: "Carné de extranjería",
  PASAPORTE: "Pasaporte",
};

export type TipoComprobante = "boleta" | "factura";

/**
 * Valida el documento que pide un comprobante. Boleta: DNI de 8 digitos.
 * Factura: RUC de 11 digitos que empieza por 10, 15, 17 o 20.
 * Devuelve el mensaje de error, o `null` si es valido.
 *
 * La usan el checkout (para avisar al escribir) y el servidor (para no
 * confiar en el navegador).
 */
export function errorDocumentoComprobante(
  comprobante: TipoComprobante,
  documento: string,
): string | null {
  const limpio = documento.trim();

  if (comprobante === "boleta") {
    return /^\d{8}$/.test(limpio) ? null : "El DNI debe tener 8 dígitos.";
  }

  if (!/^\d{11}$/.test(limpio)) return "El RUC debe tener 11 dígitos.";
  if (!/^(10|15|17|20)/.test(limpio)) return "El RUC debe empezar por 10, 15, 17 o 20.";
  return null;
}
