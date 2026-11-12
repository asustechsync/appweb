import { entorno } from "@appweb/api/entorno";
import { enlaceWhatsApp, mensajeConsultaWhatsApp, mensajePackWhatsApp } from "@appweb/core";

/**
 * Numero de WhatsApp de la tienda (WHATSAPP_TIENDA en .env.local). Sin numero,
 * no se muestra ningun boton de WhatsApp: mejor nada que un enlace roto.
 */
const NUMERO_TIENDA = entorno().WHATSAPP_TIENDA ?? null;

/** Enlace para escribir a la tienda, con el mensaje ya puesto. `null` sin numero. */
export function whatsappTienda(mensaje: string = mensajeConsultaWhatsApp()): string | null {
  return enlaceWhatsApp(NUMERO_TIENDA, mensaje);
}

/** Enlace para pedir un pack por WhatsApp. `null` sin numero: la tarjeta no pinta boton. */
export function whatsappPack(pack: { nombre: string; precio: number }): string | null {
  return enlaceWhatsApp(NUMERO_TIENDA, mensajePackWhatsApp(pack));
}

/**
 * Ventas al por mayor: WHATSAPP_MAYORISTA si hay un numero aparte para eso, o
 * el de la tienda si no. `null` si no hay ninguno.
 */
export function whatsappMayorista(): string | null {
  return enlaceWhatsApp(
    entorno().WHATSAPP_MAYORISTA ?? NUMERO_TIENDA,
    "Hola, quisiera cotizar una compra al por mayor.",
  );
}
