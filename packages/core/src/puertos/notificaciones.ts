/**
 * PUERTO — Avisos al cliente (correo, WhatsApp, SMS).
 *
 * Implementaciones en ./correo.ts: `CorreoResend` (envio real) y
 * `CorreoConsola` (desarrollo, imprime en la terminal). Cada app elige cual
 * en un solo archivo, como con la pasarela de pago.
 */

export type CanalAviso = "correo" | "whatsapp" | "sms";

export interface Mensaje {
  canal: CanalAviso;
  destino: string;
  asunto?: string;
  cuerpo: string;
}

export interface Notificaciones {
  readonly nombre: string;
  readonly canalesSoportados: readonly CanalAviso[];
  enviar(mensaje: Mensaje): Promise<{ enviado: boolean; motivo?: string }>;
}
