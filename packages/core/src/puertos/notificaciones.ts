/**
 * PUERTO — Avisos al cliente (correo, WhatsApp, SMS).
 *
 * Sin implementar. Cuando entre, los cambios de estado del pedido la llamaran
 * desde un solo sitio: `pedidos/estados.ts`, no desde cada pantalla.
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
