"use client";

import { useState } from "react";
import Link from "next/link";

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

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviado(true);
  }

  return (
    <DisposicionAcceso
      titulo="Te enviaremos un enlace para crear una nueva contraseña"
      pie={<Link href="/ingresar">Volver a ingresar</Link>}
    >
      {enviado ? (
        <Alerta tono="exito">
          Si {email} tiene una cuenta, te enviaremos un enlace para recuperar tu contraseña.
        </Alerta>
      ) : (
        <Formulario onSubmit={enviar}>
          <Campo
            id="email"
            etiqueta="Correo"
            tipo="email"
            valor={email}
            onCambio={setEmail}
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
