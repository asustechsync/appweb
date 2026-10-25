/**
 * Enlaces de WhatsApp (wa.me) con el mensaje ya escrito.
 *
 * Es la integracion sin costo: abre el chat en el telefono o en WhatsApp Web
 * y la persona solo pulsa enviar. Los avisos automaticos (API de WhatsApp
 * Business) son otra cosa y entraran por el puerto `notificaciones`.
 *
 * Los textos viven aqui para que la tienda, el panel y la app movil escriban
 * lo mismo.
 */

import { MONEDA } from "../formato";

/**
 * Numero en el formato de wa.me: solo digitos y con codigo de pais.
 * "987 654 321" -> "51987654321" (celular peruano). `null` si no sirve.
 */
export function numeroWhatsApp(numero: string | null | undefined): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  if (/^9\d{8}$/.test(digitos)) return `51${digitos}`;
  if (/^519\d{8}$/.test(digitos)) return digitos;
  // Otro pais, ya con su codigo.
  if (digitos.length >= 10 && digitos.length <= 15) return digitos;
  return null;
}

export function enlaceWhatsApp(numero: string | null | undefined, mensaje: string): string | null {
  const destino = numeroWhatsApp(numero);
  if (destino === null) return null;
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`;
}

/** Sin numero: WhatsApp abre con el mensaje escrito y se elige el chat a mano. */
export function enlaceCompartirWhatsApp(mensaje: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeConsultaWhatsApp(): string {
  return "Hola, tengo una consulta sobre sus productos.";
}

/** Del cliente a la tienda: manda su comprobante de pago. */
export function mensajeComprobanteWhatsApp(datos: { codigo: string; total: number }): string {
  return `Hola, les envío el comprobante de pago de mi pedido ${datos.codigo} por ${MONEDA.format(datos.total)}.`;
}

/** De la tienda al cliente: su pago ya entro. */
export function mensajePagoRecibidoWhatsApp(datos: {
  nombre: string;
  codigo: string;
  monto: number;
  medio: string;
}): string {
  return `Hola, ${datos.nombre}. Recibimos tu pago de ${MONEDA.format(datos.monto)} por ${datos.medio} del pedido ${datos.codigo}. ¡Gracias por tu compra!`;
}

/** De la tienda al cliente, desde el panel. */
export function mensajeAlClienteWhatsApp(datos: { nombre: string; codigo: string }): string {
  return `Hola, ${datos.nombre}. Te escribimos de la tienda por tu pedido ${datos.codigo}.`;
}
