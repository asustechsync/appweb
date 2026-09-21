import { PagoManual, type MedioPago } from "@appweb/core/puertos";

/**
 * Instancia unica de la pasarela activa.
 *
 * Hoy siempre `PagoManual`. El dia que entre la pasarela real (Izipay/Culqi),
 * esta es la UNICA linea que cambia — el checkout y la pagina del pedido
 * siguen hablando con la interfaz `PasarelaPago` sin saber cual hay detras.
 */
export const pasarela = new PagoManual({
  ...(process.env["YAPE_NUMERO"] ? { numeroYape: process.env["YAPE_NUMERO"] } : {}),
  ...(process.env["PLIN_NUMERO"] ? { numeroPlin: process.env["PLIN_NUMERO"] } : {}),
  ...(process.env["CUENTA_BANCARIA"] ? { cuentaBancaria: process.env["CUENTA_BANCARIA"] } : {}),
  ...(process.env["TITULAR_CUENTA"] ? { titular: process.env["TITULAR_CUENTA"] } : {}),
});

/** El enum de Prisma va en mayusculas; `PasarelaPago` habla el `MedioPago` de core. */
const ENUM_A_MEDIO: Record<string, MedioPago> = {
  YAPE: "yape",
  PLIN: "plin",
  TRANSFERENCIA: "transferencia",
  CONTRA_ENTREGA: "contra_entrega",
};

export function medioPagoDesdeEnum(valor: string): MedioPago {
  return ENUM_A_MEDIO[valor] ?? "transferencia";
}
