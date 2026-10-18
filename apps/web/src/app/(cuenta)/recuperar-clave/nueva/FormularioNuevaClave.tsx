"use client";

import { useState } from "react";
import Link from "next/link";

import { evaluarClave } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  DisposicionAcceso,
  Formulario,
  IconoCandado,
  IndicadorClave,
} from "@appweb/ui";

import { restablecerClave } from "../acciones";

/** Elige la clave nueva desde el enlace del correo. */
export function FormularioNuevaClave({ token }: { token: string }) {
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [lista, setLista] = useState(false);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    if (clave !== repetida) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }
    setError(null);
    setGuardando(true);
    const resultado = await restablecerClave({ token, clave });
    setGuardando(false);
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo guardar. Inténtalo de nuevo.");
      return;
    }
    setLista(true);
  }

  return (
    <DisposicionAcceso
      titulo="Elige tu nueva contraseña"
      pie={<Link href="/recuperar-clave">Pedir otro enlace</Link>}
    >
      {lista ? (
        <>
          <Alerta tono="exito" centrada>
            <strong>Listo.</strong> Tu contraseña cambió. Ya puedes ingresar con la nueva.
          </Alerta>
          <Boton href="/ingresar" anchoCompleto>
            Ingresar
          </Boton>
        </>
      ) : (
        <Formulario onSubmit={guardar}>
          {error ? <Alerta tono="error">{error}</Alerta> : null}
          <Campo
            id="clave"
            etiqueta="Contraseña nueva"
            tipo="password"
            valor={clave}
            onCambio={setClave}
            autoComplete="new-password"
            placeholder="Contraseña nueva"
            icono={<IconoCandado />}
            etiquetaOculta
            requerido
          />
          <IndicadorClave requisitos={evaluarClave(clave)} vacia={clave === ""} />
          <Campo
            id="clave-repetida"
            etiqueta="Repite la contraseña"
            tipo="password"
            valor={repetida}
            onCambio={setRepetida}
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            icono={<IconoCandado />}
            etiquetaOculta
            requerido
          />
          <Boton tipo="submit" anchoCompleto disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar contraseña"}
          </Boton>
        </Formulario>
      )}
    </DisposicionAcceso>
  );
}
