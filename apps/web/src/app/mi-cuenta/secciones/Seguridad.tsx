"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Alerta, Boton, Campo, Formulario, Tarjeta } from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

export function Seguridad() {
  const trpc = useTRPC();

  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cambiarClave = useMutation(
    trpc.cuenta.cambiarClave.mutationOptions({
      onSuccess: () => {
        setError(null);
        setAviso("Clave actualizada.");
        setClaveActual("");
        setClaveNueva("");
      },
      onError: (fallo: unknown) => {
        setAviso(null);
        setError(fallo instanceof Error ? fallo.message : "No se pudo cambiar la clave.");
      },
    }),
  );

  return (
    <Tarjeta titulo="Cambiar clave">
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      <Formulario
        onSubmit={(evento) => {
          evento.preventDefault();
          cambiarClave.mutate({ claveActual, claveNueva });
        }}
      >
        <Campo
          id="clave-actual"
          etiqueta="Clave actual"
          tipo="password"
          valor={claveActual}
          onCambio={setClaveActual}
          autoComplete="current-password"
          requerido
        />
        <Campo
          id="clave-nueva"
          etiqueta="Clave nueva"
          tipo="password"
          valor={claveNueva}
          onCambio={setClaveNueva}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          requerido
        />
        <Boton tipo="submit" disabled={cambiarClave.isPending}>
          {cambiarClave.isPending ? "Cambiando…" : "Cambiar clave"}
        </Boton>
      </Formulario>
    </Tarjeta>
  );
}
