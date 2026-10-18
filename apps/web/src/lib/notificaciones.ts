import { CorreoConsola, CorreoResend, type Notificaciones } from "@appweb/core/puertos";

/**
 * Instancia unica del correo, como `pasarela` en ./pago.ts.
 *
 * Con RESEND_API_KEY envia de verdad; sin ella imprime cada correo en la
 * terminal de `npm run dev`. Cambiar de proveedor es cambiar esta linea.
 */
export const correo: Notificaciones = process.env["RESEND_API_KEY"]
  ? new CorreoResend({
      apiKey: process.env["RESEND_API_KEY"],
      remitente: process.env["CORREO_REMITENTE"] ?? "Tienda <onboarding@resend.dev>",
    })
  : new CorreoConsola();

/**
 * Envia sin frenar a quien llama: un correo que falla no puede tumbar un
 * checkout ni una recuperacion de clave. El fallo queda en el log del servidor.
 */
export async function enviarCorreo(destino: string, asunto: string, cuerpo: string): Promise<void> {
  try {
    const resultado = await correo.enviar({ canal: "correo", destino, asunto, cuerpo });
    if (!resultado.enviado) console.error(`Correo a ${destino} no enviado: ${resultado.motivo}`);
  } catch (error) {
    console.error(`Correo a ${destino} falló:`, error);
  }
}

export const URL_TIENDA = process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000";
export const URL_PANEL = process.env["NEXT_PUBLIC_ADMIN_URL"] ?? "http://localhost:3001";
