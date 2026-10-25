import type { MarcaTarjeta, MedioPagoPedido } from "@appweb/core";
import type { MedioLogo } from "@appweb/ui";

/** El logo de cada medio en la lista de pagos; la tarjeta, segun su marca. */
export const LOGO_MEDIO: Record<MedioPagoPedido, MedioLogo> = {
  YAPE: "yape",
  PLIN: "plin",
  TRANSFERENCIA: "transferencia",
  CONTRA_ENTREGA: "contraEntrega",
  TARJETA: "tarjeta",
};
export const LOGO_MARCA: Record<MarcaTarjeta, MedioLogo> = {
  visa: "visa",
  mastercard: "mastercard",
  otra: "tarjeta",
};
