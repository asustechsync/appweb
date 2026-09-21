"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  EstadoVacio,
  FilaLista,
  Formulario,
  Insignia,
  Tarjeta,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

export function Direcciones() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [agregando, setAgregando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [calle, setCalle] = useState("");
  const [referencia, setReferencia] = useState("");

  const lista = useQuery(trpc.cuenta.direcciones.queryOptions());

  function refrescar() {
    void queryClient.invalidateQueries(trpc.cuenta.direcciones.pathFilter());
  }

  function alFallar(fallo: unknown) {
    setError(fallo instanceof Error ? fallo.message : "No se pudo completar la acción.");
  }

  const crear = useMutation(
    trpc.cuenta.crearDireccion.mutationOptions({
      onSuccess: () => {
        setError(null);
        setAgregando(false);
        setDepartamento("");
        setProvincia("");
        setDistrito("");
        setCalle("");
        setReferencia("");
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const marcarPrincipal = useMutation(
    trpc.cuenta.marcarPrincipal.mutationOptions({
      onSuccess: () => {
        setError(null);
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const eliminar = useMutation(
    trpc.cuenta.eliminarDireccion.mutationOptions({
      onSuccess: () => {
        setError(null);
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const trabajando = crear.isPending || marcarPrincipal.isPending || eliminar.isPending;

  return (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <Tarjeta
        titulo="Mis direcciones"
        acciones={
          <Boton variante="secundario" onClick={() => setAgregando((valor) => !valor)}>
            {agregando ? "Cancelar" : "+ Agregar dirección"}
          </Boton>
        }
      >
        {agregando ? (
          <Formulario
            onSubmit={(evento) => {
              evento.preventDefault();
              crear.mutate({
                departamento,
                provincia,
                distrito,
                calle,
                principal: lista.data?.length === 0,
                ...(referencia.trim() === "" ? {} : { referencia }),
              });
            }}
          >
            <Campo
              id="dir-departamento"
              etiqueta="Departamento"
              valor={departamento}
              onCambio={setDepartamento}
              requerido
            />
            <Campo
              id="dir-provincia"
              etiqueta="Provincia"
              valor={provincia}
              onCambio={setProvincia}
              requerido
            />
            <Campo
              id="dir-distrito"
              etiqueta="Distrito"
              valor={distrito}
              onCambio={setDistrito}
              requerido
            />
            <Campo
              id="dir-calle"
              etiqueta="Dirección completa"
              valor={calle}
              onCambio={setCalle}
              requerido
            />
            <Campo
              id="dir-referencia"
              etiqueta="Referencia (opcional)"
              valor={referencia}
              onCambio={setReferencia}
            />
            <Boton tipo="submit" disabled={crear.isPending}>
              {crear.isPending ? "Guardando…" : "Guardar dirección"}
            </Boton>
          </Formulario>
        ) : null}

        {lista.isPending ? (
          <Cargando texto="Cargando tus direcciones…" />
        ) : lista.isError ? (
          <Alerta tono="error">{lista.error.message}</Alerta>
        ) : lista.data.length === 0 ? (
          <EstadoVacio
            titulo="Sin direcciones guardadas"
            texto="Agrega una para no tener que escribirla en cada compra."
          />
        ) : (
          lista.data.map((direccion) => (
            <FilaLista
              key={direccion.id}
              acciones={
                <>
                  {!direccion.principal ? (
                    <Boton
                      variante="secundario"
                      disabled={trabajando}
                      onClick={() => marcarPrincipal.mutate({ direccionId: direccion.id })}
                    >
                      Usar por defecto
                    </Boton>
                  ) : null}
                  <Boton
                    variante="secundario"
                    disabled={trabajando}
                    onClick={() => eliminar.mutate({ direccionId: direccion.id })}
                  >
                    Eliminar
                  </Boton>
                </>
              }
            >
              <strong>{direccion.calle}</strong>
              <span>
                {direccion.distrito}, {direccion.provincia}, {direccion.departamento}
              </span>
              {direccion.referencia ? <span>{direccion.referencia}</span> : null}
              {direccion.principal ? (
                <span>
                  <Insignia tono="marca">Por defecto</Insignia>
                </span>
              ) : null}
            </FilaLista>
          ))
        )}
      </Tarjeta>
    </>
  );
}
