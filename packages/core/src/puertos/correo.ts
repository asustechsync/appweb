import type { CanalAviso, Mensaje, Notificaciones } from "./notificaciones";

/**
 * Correo de desarrollo: no envia nada, imprime el mensaje en la terminal del
 * servidor. Con esto se prueba "recuperar clave" o el aviso de pedido sin
 * tener cuenta en ningun proveedor.
 */
export class CorreoConsola implements Notificaciones {
  readonly nombre = "Correo en consola";
  readonly canalesSoportados: readonly CanalAviso[] = ["correo"];

  async enviar(mensaje: Mensaje): Promise<{ enviado: boolean; motivo?: string }> {
    console.info(
      [
        "",
        "─── Correo (no enviado: falta RESEND_API_KEY) ───",
        `Para:   ${mensaje.destino}`,
        `Asunto: ${mensaje.asunto ?? "(sin asunto)"}`,
        "",
        mensaje.cuerpo,
        "─────────────────────────────────────────────────",
      ].join("\n"),
    );
    return { enviado: true };
  }
}

/**
 * Correo real por Resend (https://resend.com), con su API HTTP: sin SDK, un
 * `fetch`. Cambiar de proveedor es escribir otra clase como esta; quien manda
 * correos solo conoce la interfaz `Notificaciones`.
 */
export class CorreoResend implements Notificaciones {
  readonly nombre = "Resend";
  readonly canalesSoportados: readonly CanalAviso[] = ["correo"];

  constructor(
    private readonly config: {
      apiKey: string;
      /** Remitente verificado en Resend, p. ej. "Tienda <pedidos@tutienda.pe>". */
      remitente: string;
    },
  ) {}

  async enviar(mensaje: Mensaje): Promise<{ enviado: boolean; motivo?: string }> {
    if (mensaje.canal !== "correo") return { enviado: false, motivo: "Solo envía correos" };
    try {
      const respuesta = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: this.config.remitente,
          to: [mensaje.destino],
          subject: mensaje.asunto ?? "",
          text: mensaje.cuerpo,
        }),
      });
      if (respuesta.ok) return { enviado: true };
      return { enviado: false, motivo: `Resend respondió ${respuesta.status}` };
    } catch (error) {
      return { enviado: false, motivo: error instanceof Error ? error.message : "Error de red" };
    }
  }
}
