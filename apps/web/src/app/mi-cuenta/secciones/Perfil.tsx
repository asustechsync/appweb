"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ETIQUETA_GENERO,
  ETIQUETA_TIPO_DOCUMENTO,
  GENEROS,
  TIPOS_DOCUMENTO,
  type Genero,
  type TipoDocumento,
} from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoSelectorLista,
  Cargando,
  FilaCampos,
  FilaTarjetas,
  Formulario,
  SelectorFecha,
  Tarjeta,
  TarjetaInfo,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

const OPCIONES_DOCUMENTO = [
  { valor: "", etiqueta: "Selecciona…" },
  ...TIPOS_DOCUMENTO.map((tipo) => ({ valor: tipo, etiqueta: ETIQUETA_TIPO_DOCUMENTO[tipo] })),
];

const OPCIONES_GENERO = [
  { valor: "", etiqueta: "Prefiero no decir" },
  ...GENEROS.filter((genero) => genero !== "PREFIERO_NO_DECIR").map((genero) => ({
    valor: genero,
    etiqueta: ETIQUETA_GENERO[genero],
  })),
];

export function Perfil() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const perfil = useQuery(trpc.cuenta.perfil.queryOptions());

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [paisTelefono, setPaisTelefono] = useState("pe");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // El formulario arranca con lo que hay guardado, no vacio: quien entra a
  // cambiar su telefono no deberia tener que reescribir su nombre.
  useEffect(() => {
    if (perfil.data === undefined) return;
    setNombre(perfil.data.nombre);
    setApellido(perfil.data.apellido ?? "");
    setTelefono(perfil.data.telefono ?? "");
    setTipoDocumento(perfil.data.tipoDocumento ?? "");
    setNumeroDocumento(perfil.data.numeroDocumento ?? "");
    setFechaNacimiento(perfil.data.fechaNacimiento ?? "");
    setGenero(perfil.data.genero === "PREFIERO_NO_DECIR" ? "" : (perfil.data.genero ?? ""));
  }, [perfil.data]);

  const guardar = useMutation(
    trpc.cuenta.guardarDatos.mutationOptions({
      onSuccess: () => {
        setError(null);
        setAviso("Datos guardados.");
        void queryClient.invalidateQueries(trpc.cuenta.perfil.pathFilter());
      },
      onError: (fallo: unknown) => {
        setAviso(null);
        setError(fallo instanceof Error ? fallo.message : "No se pudo guardar.");
      },
    }),
  );

  if (perfil.isPending) return <Cargando texto="Cargando tus datos…" />;
  if (perfil.isError) return <Alerta tono="error">{perfil.error.message}</Alerta>;

  return (
    <FilaTarjetas>
      <Tarjeta>
        {error ? <Alerta tono="error">{error}</Alerta> : null}
        {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

        <Formulario
          ancho="completo"
          onSubmit={(evento) => {
            evento.preventDefault();
            guardar.mutate({
              nombre,
              ...(apellido.trim() === "" ? {} : { apellido }),
              ...(telefono.trim() === "" ? {} : { telefono }),
              ...(tipoDocumento === ""
                ? {}
                : { tipoDocumento: tipoDocumento as TipoDocumento, numeroDocumento }),
              ...(fechaNacimiento === "" ? {} : { fechaNacimiento }),
              ...(genero === "" ? {} : { genero: genero as Genero }),
            });
          }}
        >
          <FilaCampos>
            <Campo
              id="datos-nombre"
              etiqueta="Nombre"
              valor={nombre}
              onCambio={setNombre}
              requerido
            />
            <Campo
              id="datos-apellido"
              etiqueta="Apellido"
              valor={apellido}
              onCambio={setApellido}
            />
          </FilaCampos>

          <FilaCampos>
            <Campo
              id="datos-telefono"
              etiqueta="Teléfono (opcional)"
              tipo="tel"
              pais={paisTelefono}
              onCambioPais={setPaisTelefono}
              valor={telefono}
              onCambio={setTelefono}
              placeholder="9XXXXXXXX"
            />
            <CampoSelectorLista
              id="datos-genero"
              etiqueta="Género"
              valor={genero}
              opciones={OPCIONES_GENERO.filter((opcion) => opcion.valor !== "")}
              onCambio={setGenero}
              placeholder="Elige una opción"
            />
          </FilaCampos>

          <FilaCampos>
            <CampoSelectorLista
              id="datos-tipo-documento"
              etiqueta="Tipo de documento"
              valor={tipoDocumento}
              opciones={OPCIONES_DOCUMENTO.filter((opcion) => opcion.valor !== "")}
              onCambio={setTipoDocumento}
              placeholder="Elige una opción"
            />
            <Campo
              id="datos-numero-documento"
              etiqueta="Número de documento"
              valor={numeroDocumento}
              onCambio={setNumeroDocumento}
              disabled={tipoDocumento === ""}
              requerido={tipoDocumento !== ""}
            />
          </FilaCampos>

          <FilaCampos>
            <SelectorFecha
              id="datos-fecha-nacimiento"
              etiqueta="Fecha de nacimiento"
              valor={fechaNacimiento}
              onCambio={setFechaNacimiento}
            />
            {/* El correo identifica la cuenta y es la llave para entrar: cambiarlo
                necesita verificarlo antes, y eso llega con las notificaciones. */}
            <Campo
              id="datos-correo"
              etiqueta="Correo electrónico"
              tipo="email"
              valor={perfil.data.email}
              onCambio={() => {}}
              disabled
            />
          </FilaCampos>
          <Boton tipo="submit" disabled={guardar.isPending}>
            {guardar.isPending ? "Guardando…" : "Guardar datos"}
          </Boton>
        </Formulario>
      </Tarjeta>

      <TarjetaInfo titulo="Para qué usamos estos datos">
        <p>Tu teléfono es para coordinar la entrega si el repartidor no te ubica.</p>
        <p>El tipo y número de documento van en tu boleta o factura.</p>
        <p>Fecha de nacimiento y género son opcionales — no afectan tus compras.</p>
      </TarjetaInfo>
    </FilaTarjetas>
  );
}
