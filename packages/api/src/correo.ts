import { CorreoConsola, CorreoResend, type Notificaciones } from "@appweb/core/puertos";

import { entorno } from "./entorno";

/**
 * Instancia unica del correo para la tienda, el panel y la app movil.
 *
 * Con RESEND_API_KEY envia de verdad; sin ella imprime cada correo en la
 * terminal de `npm run dev`. Cambiar de proveedor es cambiar esta linea.
 */
function crearCorreo(): Notificaciones {
  const { RESEND_API_KEY: apiKey, CORREO_REMITENTE: remitente } = entorno();
  return apiKey
    ? new CorreoResend({ apiKey, remitente: remitente ?? "Tienda <onboarding@resend.dev>" })
    : new CorreoConsola();
}

export const correo: Notificaciones = crearCorreo();

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
