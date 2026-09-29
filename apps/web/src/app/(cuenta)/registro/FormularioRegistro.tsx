"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AccesoSocial, Alerta, Boton, Campo, DisposicionAcceso, Formulario } from "@appweb/ui";

import { registrar } from "./acciones";

export function FormularioRegistro() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
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
      titulo="Crea tu cuenta"
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
          requerido
        />
        <Campo
          id="clave"
          etiqueta="Contraseña"
          tipo="password"
          valor={clave}
          onCambio={setClave}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          requerido
        />
        <Campo
          id="telefono"
          etiqueta="Teléfono"
          tipo="tel"
          pais={paisTelefono}
          onCambioPais={setPaisTelefono}
          valor={telefono}
          onCambio={setTelefono}
          autoComplete="tel"
        />

        <Boton tipo="submit" disabled={enviando} anchoCompleto>
          {enviando ? "Creando cuenta…" : "Crear cuenta"}
        </Boton>
      </Formulario>
    </DisposicionAcceso>
  );
}
