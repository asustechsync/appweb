"use client";

import { useState } from "react";
import Link from "next/link";

import { esquemaRecuperacion } from "@appweb/core/tipos";
import { Alerta, Boton, Campo, DisposicionAcceso, Formulario, IconoCorreo } from "@appweb/ui";

import { pedirRecuperacion } from "./acciones";

/**
 * Pide el correo para recuperar la contraseña. La respuesta es la misma
 * exista o no la cuenta, para no revelar quien esta registrado: eso lo decide
 * `pedirRecuperacion`, aqui solo se valida el formato.
 */
export function FormularioRecuperar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const analizado = esquemaRecuperacion.safeParse({ email });
    if (!analizado.success) {
      setError(analizado.error.issues[0]?.message ?? "Escribe un correo válido");
      return;
    }
    setError(null);
    setEnviando(true);
    const resultado = await pedirRecuperacion({ email });
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo enviar. Inténtalo de nuevo.");
      return;
    }
    setEnviado(true);
  }

  return (
    <DisposicionAcceso
      titulo="Recupera tu contraseña"
      pie={<Link href="/ingresar">Volver a ingresar</Link>}
    >
      {enviado ? (
        <Alerta tono="exito" centrada>
          <strong>Revisa tu correo.</strong> Si {email} está registrado, te enviamos un enlace que
          vale 1 hora.
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
          <Boton tipo="submit" anchoCompleto disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar enlace"}
          </Boton>
        </Formulario>
      )}
    </DisposicionAcceso>
  );
}
