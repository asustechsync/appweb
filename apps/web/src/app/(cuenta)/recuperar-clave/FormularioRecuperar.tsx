"use client";

import { useState } from "react";
import Link from "next/link";

import { esquemaRecuperacion } from "@appweb/core/tipos";
import { Alerta, Boton, Campo, DisposicionAcceso, Formulario, IconoCorreo } from "@appweb/ui";

/**
 * Pide el correo para recuperar la contraseña.
 *
 * Aun no envia nada: el envio de correos (`puertos/notificaciones.ts`) es una
 * integracion aplazada. Por ahora solo muestra la confirmacion; cuando exista
 * el puerto, `enviar` llamara a una accion del servidor. La respuesta es la
 * misma exista o no el correo, para no revelar que cuentas hay.
 */
export function FormularioRecuperar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const analizado = esquemaRecuperacion.safeParse({ email });
    if (!analizado.success) {
      setError(analizado.error.issues[0]?.message ?? "Escribe un correo válido");
      return;
    }
    setError(null);
    setEnviado(true);
  }

  return (
    <DisposicionAcceso
      titulo="Recupera tu contraseña"
      pie={<Link href="/ingresar">Volver a ingresar</Link>}
    >
      {enviado ? (
        <Alerta tono="exito" centrada>
          <strong>Revisa tu correo.</strong> Si {email} está registrado, te enviamos un enlace.
        </Alerta>
      ) : (
        <Formulario onSubmit={enviar}>
          <Campo
            id="email"
            etiqueta="Correo"
            tipo="email"
            valor={email}
            onCambio={setEmail}
            error={error}
            autoComplete="email"
            placeholder="Correo electrónico"
            icono={<IconoCorreo />}
            etiquetaOculta
            requerido
          />
          <Boton tipo="submit" anchoCompleto>
            Enviar enlace
          </Boton>
        </Formulario>
      )}
    </DisposicionAcceso>
  );
}
