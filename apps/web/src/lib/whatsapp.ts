import { enlaceWhatsApp, mensajeConsultaWhatsApp } from "@appweb/core";

/**
 * Numero de WhatsApp de la tienda (WHATSAPP_TIENDA en .env.local). Sin numero,
 * no se muestra ningun boton de WhatsApp: mejor nada que un enlace roto.
 */
const NUMERO_TIENDA = process.env["WHATSAPP_TIENDA"] ?? null;

/** Enlace para escribir a la tienda, con el mensaje ya puesto. `null` sin numero. */
export function whatsappTienda(mensaje: string = mensajeConsultaWhatsApp()): string | null {
  return enlaceWhatsApp(NUMERO_TIENDA, mensaje);
}
