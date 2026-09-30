"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  AccesoSocial,
  Alerta,
  Boton,
  Campo,
  Casilla,
  DisposicionAcceso,
  Formulario,
  IconoCandado,
  IconoCorreo,
  IconoTelefono,
} from "@appweb/ui";

import { registrar } from "./acciones";

export function FormularioRegistro() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [paisTelefono, setPaisTelefono] = useState("pe");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado = await registrar({
      email,
      clave,
      telefono: telefono.trim() === "" ? undefined : telefono,
    });

    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo crear la cuenta.");
      setEnviando(false);
      return;
    }

    router.push("/mi-cuenta");
    router.refresh();
  }

  return (
    <DisposicionAcceso
      activa="registro"
      titulo="Únete"
      alternativas={<AccesoSocial />}
    >
      <Formulario onSubmit={enviar}>
        {error ? <Alerta tono="error">{error}</Alerta> : null}

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
        <Campo
          id="clave"
          etiqueta="Contraseña"
          tipo="password"
          valor={clave}
          onCambio={setClave}
          autoComplete="new-password"
          placeholder="Contraseña"
          icono={<IconoCandado />}
          etiquetaOculta
          requerido
        />
        <Campo
          id="telefono"
          etiqueta="Teléfono"
          placeholder="Teléfono"
          icono={<IconoTelefono />}
          etiquetaOculta
          tipo="tel"
          pais={paisTelefono}
          onCambioPais={setPaisTelefono}
          valor={telefono}
          onCambio={setTelefono}
          autoComplete="tel"
        />

        <Casilla
          id="terminos"
          etiqueta={
            <>
              Acepto los <Link href="/terminos">Términos</Link> y la <Link href="/privacidad">Privacidad</Link>
            </>
          }
          marcada={acepta}
          onCambio={setAcepta}
          requerida
        />

        <Boton tipo="submit" disabled={enviando} anchoCompleto>
          {enviando ? "Creando cuenta…" : "Crear cuenta"}
        </Boton>
      </Formulario>
    </DisposicionAcceso>
  );
}
