"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import {
  Alerta,
  Boton,
  Campo,
  FilaTarjetas,
  Formulario,
  IconoCandado,
  IndicadorClave,
  Tarjeta,
  TarjetaInfo,
} from "@appweb/ui";

import { evaluarClave } from "@appweb/core";

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
    <FilaTarjetas>
      <Tarjeta titulo="Cambiar clave" sinMarco>
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
            etiquetaOculta
            tipo="password"
            valor={claveActual}
            onCambio={setClaveActual}
            autoComplete="current-password"
            placeholder="Clave actual"
            icono={<IconoCandado />}
            requerido
          />
          <Campo
            id="clave-nueva"
            etiqueta="Clave nueva"
            etiquetaOculta
            tipo="password"
            valor={claveNueva}
            onCambio={setClaveNueva}
            autoComplete="new-password"
            placeholder="Clave nueva"
            icono={<IconoCandado />}
            requerido
          />
          <IndicadorClave requisitos={evaluarClave(claveNueva)} vacia={claveNueva === ""} />
          <Boton tipo="submit" disabled={cambiarClave.isPending}>
            {cambiarClave.isPending ? "Cambiando…" : "Cambiar clave"}
          </Boton>
        </Formulario>
      </Tarjeta>

      <TarjetaInfo titulo="Cuida tu cuenta">
        <p>Elige una clave de al menos 8 caracteres que no uses en otros sitios.</p>
        <p>Para cambiarla te pedimos tu clave actual, así nadie más puede hacerlo desde tu sesión abierta.</p>
        <p>Nunca te pediremos tu clave por correo ni por WhatsApp.</p>
      </TarjetaInfo>
    </FilaTarjetas>
  );
}
