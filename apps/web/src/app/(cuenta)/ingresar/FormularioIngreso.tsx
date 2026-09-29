"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AccesoSocial, Alerta, Boton, Campo, Casilla, DisposicionAcceso, Formulario } from "@appweb/ui";

import { ingresar } from "./acciones";

export interface PropsFormularioIngreso {
  /** A donde vuelve tras ingresar. `/mi-cuenta` si nadie lo mando desde otro lado. */
  siguiente: string;
}

export function FormularioIngreso({ siguiente }: PropsFormularioIngreso) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado = await ingresar({ email, clave, recordar });

    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo ingresar.");
      setEnviando(false);
      return;
    }

    router.push(siguiente);
    router.refresh();
  }

  return (
    <DisposicionAcceso
      activa="ingresar"
      titulo="Entra a tu cuenta para continuar"
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
          autoComplete="current-password"
          enlaceEtiqueta={<Link href="/ayuda/contacto">¿Olvidaste tu contraseña?</Link>}
          requerido
        />
        <Casilla id="recordar" etiqueta="Recordarme" marcada={recordar} onCambio={setRecordar} />

        <Boton tipo="submit" disabled={enviando} anchoCompleto>
          {enviando ? "Ingresando…" : "Ingresar"}
        </Boton>
      </Formulario>
    </DisposicionAcceso>
  );
}
