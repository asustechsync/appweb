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
  FilaOpciones,
  Formulario,
  IconoCandado,
  IconoCorreo,
} from "@appweb/ui";
import { esquemaIngreso } from "@appweb/core/tipos";

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
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    const datos = { email, clave, recordar };
    const analizado = esquemaIngreso.safeParse(datos);
    const nuevos: Record<string, string> = {};
    if (!analizado.success) {
      for (const problema of analizado.error.issues) {
        nuevos[String(problema.path[0])] ??= problema.message;
      }
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    const resultado = await ingresar(datos);

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
      titulo="Bienvenido"
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
          error={errores["email"] ?? null}
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
          error={errores["clave"] ?? null}
          autoComplete="current-password"
          placeholder="Contraseña"
          icono={<IconoCandado />}
          etiquetaOculta
          requerido
        />
        <FilaOpciones>
          <Casilla id="recordar" etiqueta="Recordarme" marcada={recordar} onCambio={setRecordar} />
          <Link href="/recuperar-clave">¿Olvidaste tu contraseña?</Link>
        </FilaOpciones>

        <Boton tipo="submit" disabled={enviando} anchoCompleto>
          {enviando ? "Ingresando…" : "Ingresar"}
        </Boton>
      </Formulario>
    </DisposicionAcceso>
  );
}
