"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Alerta, Boton, Campo, Formulario, PaginaInformativa } from "@appweb/ui";

import { ingresar } from "./acciones";

export interface PropsFormularioIngreso {
  /** A donde vuelve tras ingresar. `/mi-cuenta` si nadie lo mando desde otro lado. */
  siguiente: string;
}

export function FormularioIngreso({ siguiente }: PropsFormularioIngreso) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado = await ingresar({ email, clave });

    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo ingresar.");
      setEnviando(false);
      return;
    }

    router.push(siguiente);
    router.refresh();
  }

  return (
    <PaginaInformativa titulo="Ingresar">
      <Formulario
        onSubmit={enviar}
        pie={
          <>
            ¿No tienes cuenta? <Link href="/registro">Crea una</Link>
          </>
        }
      >
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
          etiqueta="Clave"
          tipo="password"
          valor={clave}
          onCambio={setClave}
          autoComplete="current-password"
          requerido
        />

        <Boton tipo="submit" disabled={enviando} anchoCompleto>
          {enviando ? "Ingresando…" : "Ingresar"}
        </Boton>
      </Formulario>
    </PaginaInformativa>
  );
}
