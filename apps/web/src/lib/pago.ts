import { entorno } from "@appweb/api/entorno";
import { PagoManual, type MedioPago } from "@appweb/core/puertos";

/**
 * Instancia unica de la pasarela activa.
 *
 * Hoy siempre `PagoManual`. El dia que entre la pasarela real (Izipay/Culqi),
 * esta es la UNICA linea que cambia — el checkout y la pagina del pedido
 * siguen hablando con la interfaz `PasarelaPago` sin saber cual hay detras.
 */
const e = entorno();
export const pasarela = new PagoManual({
  ...(e.YAPE_NUMERO ? { numeroYape: e.YAPE_NUMERO } : {}),
  ...(e.PLIN_NUMERO ? { numeroPlin: e.PLIN_NUMERO } : {}),
  ...(e.CUENTA_BANCARIA ? { cuentaBancaria: e.CUENTA_BANCARIA } : {}),
  ...(e.TITULAR_CUENTA ? { titular: e.TITULAR_CUENTA } : {}),
  tarjetaDePrueba: e.tarjetaDePrueba,
});

/** El enum de Prisma va en mayusculas; `PasarelaPago` habla el `MedioPago` de core. */
const ENUM_A_MEDIO: Record<string, MedioPago> = {
  YAPE: "yape",
  PLIN: "plin",
  TRANSFERENCIA: "transferencia",
  TARJETA: "tarjeta",
};

export function medioPagoDesdeEnum(valor: string): MedioPago {
  return ENUM_A_MEDIO[valor] ?? "transferencia";
}

/** Como se nombra y explica cada medio al cliente (checkout y confirmacion). */
export const ETIQUETAS_MEDIO: Partial<
  Record<MedioPago, { etiqueta: string; descripcion: string }>
> = {
  yape: { etiqueta: "Yape", descripcion: "Yapea el total y sube tu captura." },
  plin: { etiqueta: "Plin", descripcion: "Envía el total por Plin y sube tu captura." },
  transferencia: {
    etiqueta: "Transferencia bancaria",
    descripcion: "Transfiere el total y sube tu constancia.",
  },
  tarjeta: {
    etiqueta: "Tarjeta (prueba)",
    descripcion: "Solo para probar: eliges la marca y 4 dígitos, no se cobra nada.",
  },
};
