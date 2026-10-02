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

/** Texto de ayuda del campo de numero para cada tipo de documento. */
export const AYUDA_NUMERO_DOCUMENTO: Record<TipoDocumento, string> = {
  DNI: "8 dígitos",
  RUC: "11 dígitos",
  CARNE_EXTRANJERIA: "Hasta 12 letras o números",
  PASAPORTE: "6 a 12 letras o números",
};

/**
 * Valida el numero de documento del perfil segun su tipo. DNI y RUC siguen
 * las mismas reglas que un comprobante; carne de extranjeria y pasaporte son
 * alfanumericos y de largo flexible porque cambian segun el emisor.
 * Devuelve el mensaje de error, o `null` si es valido.
 */
export function errorNumeroDocumento(tipo: TipoDocumento, numero: string): string | null {
  const limpio = numero.trim();
  if (limpio === "") return "Escribe el número de documento.";

  if (tipo === "DNI") return errorDocumentoComprobante("boleta", limpio);
  if (tipo === "RUC") return errorDocumentoComprobante("factura", limpio);

  if (!/^[A-Za-z0-9]+$/.test(limpio)) return "Usa solo letras y números, sin espacios ni guiones.";
  if (tipo === "CARNE_EXTRANJERIA") {
    return limpio.length <= 12 ? null : "El carné de extranjería tiene hasta 12 caracteres.";
  }
  return limpio.length >= 6 && limpio.length <= 12 ? null : "El pasaporte tiene entre 6 y 12 caracteres.";
}

/** Version corta para controles angostos, como el selector del perfil. */
export const ABREVIATURA_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  DNI: "DNI",
  RUC: "RUC",
  CARNE_EXTRANJERIA: "CE",
  PASAPORTE: "PAS",
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
