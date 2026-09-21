"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Alerta, Boton, Campo, Formulario, PaginaInformativa } from "@appweb/ui";

import { registrar } from "./acciones";

export function FormularioRegistro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado = await registrar({
      nombre,
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
    <PaginaInformativa titulo="Crear cuenta">
      <Formulario
        onSubmit={enviar}
        pie={
          <>
            ¿Ya tienes cuenta? <Link href="/ingresar">Ingresa</Link>
          </>
        }
      >
        {error ? <Alerta tono="error">{error}</Alerta> : null}

        <Campo id="nombre" etiqueta="Nombre" valor={nombre} onCambio={setNombre} requerido />
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
          etiqueta="Clave"
          tipo="password"
          valor={clave}
          onCambio={setClave}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          requerido
        />
        <Campo
          id="telefono"
          etiqueta="Teléfono (opcional)"
          tipo="tel"
          bandera="pe"
          prefijo="+51"
          valor={telefono}
          onCambio={setTelefono}
          autoComplete="tel"
          placeholder="9XXXXXXXX"
        />

        <Boton tipo="submit" disabled={enviando} anchoCompleto>
          {enviando ? "Creando cuenta…" : "Crear cuenta"}
        </Boton>
      </Formulario>
    </PaginaInformativa>
  );
}
