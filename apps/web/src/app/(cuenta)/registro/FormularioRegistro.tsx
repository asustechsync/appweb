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
  IndicadorClave,
} from "@appweb/ui";
import { evaluarClave } from "@appweb/core";
import { esquemaAutorregistro } from "@appweb/core/tipos";

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
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    const datos = {
      email,
      clave,
      telefono,
    };
    const analizado = esquemaAutorregistro.safeParse(datos);
    const nuevos: Record<string, string> = {};
    if (!analizado.success) {
      for (const problema of analizado.error.issues) {
        const campo = String(problema.path[0]);
        nuevos[campo] ??= problema.message;
      }
    }
    setErrores(nuevos);
    if (!acepta || Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    const resultado = await registrar(datos);

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
          autoComplete="new-password"
          placeholder="Contraseña"
          icono={<IconoCandado />}
          etiquetaOculta
          requerido
        />
        <IndicadorClave requisitos={evaluarClave(clave)} vacia={clave === ""} />
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
          error={/\D/.test(telefono) ? "Solo se permiten números" : (errores["telefono"] ?? null)}
          autoComplete="tel"
          requerido
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

        <Boton tipo="submit" disabled={enviando || !acepta} anchoCompleto>
          {enviando ? "Creando cuenta…" : "Crear cuenta"}
        </Boton>
      </Formulario>
    </DisposicionAcceso>
  );
}
