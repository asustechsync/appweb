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
