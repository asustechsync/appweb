"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ETIQUETA_GENERO,
  ABREVIATURA_TIPO_DOCUMENTO,
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
  FilaUnida,
  FilaTarjetas,
  IconoEtiqueta,
  Formulario,
  IconoCorreo,
  IconoMarca,
  IconoTarjetaPersonal,
  IconoTelefono,
  IconoUbicacion,
  IconoUsuario,
  SelectorFecha,
  Tarjeta,
  Pestanas,
  TarjetaInfo,
} from "@appweb/ui";

import { esquemaPerfil } from "@appweb/core/tipos";

import { useTRPC } from "@/lib/trpc";

const OPCIONES_DOCUMENTO = [
  { valor: "", etiqueta: "Selecciona…" },
  // El RUC es de la empresa: no se ofrece en los datos personales.
  ...TIPOS_DOCUMENTO.filter((tipo) => tipo !== "RUC").map((tipo) => ({
    valor: tipo,
    etiqueta: ABREVIATURA_TIPO_DOCUMENTO[tipo],
  })),
];

const OPCIONES_GENERO = [
  { valor: "", etiqueta: "Género" },
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
  const [apodo, setApodo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [paisTelefono, setPaisTelefono] = useState("pe");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [empresaRuc, setEmpresaRuc] = useState("");
  const [empresaRazonSocial, setEmpresaRazonSocial] = useState("");
  const [empresaNombreComercial, setEmpresaNombreComercial] = useState("");
  const [empresaTelefonoEmpresa, setEmpresaTelefonoEmpresa] = useState("");
  const [empresaDireccionFiscal, setEmpresaDireccionFiscal] = useState("");
  const [empresaCorreoFacturacion, setEmpresaCorreoFacturacion] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("");

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [pestana, setPestana] = useState("personal");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // El formulario arranca con lo que hay guardado, no vacio: quien entra a
  // cambiar su telefono no deberia tener que reescribir su nombre.
  useEffect(() => {
    if (perfil.data === undefined) return;
    setNombre(perfil.data.nombre);
    setApellido(perfil.data.apellido ?? "");
    setApodo(perfil.data.apodo ?? "");
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
      <Tarjeta sinMarco>
        <Pestanas
          etiqueta="Tipo de perfil"
          opciones={[
            { id: "personal", etiqueta: "Personal" },
            { id: "empresa", etiqueta: "Empresa" },
          ]}
          activa={pestana}
          onCambio={setPestana}
        />
        {error ? <Alerta tono="error">{error}</Alerta> : null}
        {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

        <div hidden={pestana !== "personal"}>
          <Formulario
            ancho="completo"
            onSubmit={(evento) => {
              evento.preventDefault();
              const datos = {
                nombre,
                ...(apellido.trim() === "" ? {} : { apellido }),
                ...(apodo.trim() === "" ? {} : { apodo }),
                ...(telefono.trim() === "" ? {} : { telefono }),
                ...(tipoDocumento === ""
                  ? {}
                  : { tipoDocumento: tipoDocumento as TipoDocumento, numeroDocumento }),
                ...(fechaNacimiento === "" ? {} : { fechaNacimiento }),
                ...(genero === "" ? {} : { genero: genero as Genero }),
              };
  
              // Mismo esquema que valida el servidor: el error aparece junto al
              // campo que falla, sin esperar la respuesta.
              const analizado = esquemaPerfil.safeParse(datos);
              const nuevos: Record<string, string> = {};
              if (!analizado.success) {
                for (const problema of analizado.error.issues) {
                  nuevos[String(problema.path[0])] ??= problema.message;
                }
              }
              setErrores(nuevos);
              if (Object.keys(nuevos).length > 0) {
                setAviso(null);
                return;
              }
              guardar.mutate(datos);
            }}
          >
            <FilaCampos>
              <FilaUnida iguales>
                <Campo
                  id="datos-nombre"
                  etiqueta="Nombre"
                  valor={nombre}
                  onCambio={setNombre}
                  error={errores["nombre"] ?? null}
                  placeholder="Nombre"
                  icono={<IconoUsuario />}
                  etiquetaOculta
                  requerido
                />
                <Campo
                  id="datos-apellido"
                  etiqueta="Apellido"
                  valor={apellido}
                  onCambio={setApellido}
                  error={errores["apellido"] ?? null}
                  placeholder="Apellido"
                  icono={<IconoUsuario />}
                  etiquetaOculta
                />
              </FilaUnida>
              <Campo
                id="datos-telefono"
                etiqueta="Teléfono (opcional)"
                tipo="tel"
                pais={paisTelefono}
                onCambioPais={setPaisTelefono}
                valor={telefono}
                onCambio={setTelefono}
                error={errores["telefono"] ?? null}
                placeholder="Teléfono"
                icono={<IconoTelefono />}
                etiquetaOculta
              />
            </FilaCampos>
  
            <FilaCampos>
              <FilaUnida iguales>
                <CampoSelectorLista
                  id="datos-genero"
                  etiqueta="Género"
                  valor={genero}
                  opciones={OPCIONES_GENERO}
                  onCambio={setGenero}
                  placeholder="Género (opcional)"
                  etiquetaOculta
                />
                <Campo
                  id="datos-apodo"
                  etiqueta="Apodo (opcional)"
                  valor={apodo}
                  onCambio={setApodo}
                  error={errores["apodo"] ?? null}
                  placeholder="Apodo"
                  icono={<IconoUsuario />}
                  etiquetaOculta
                />
              </FilaUnida>
              <FilaUnida>
                <CampoSelectorLista
                  id="datos-tipo-documento"
                  etiqueta="Tipo de documento"
                  valor={tipoDocumento}
                  opciones={OPCIONES_DOCUMENTO.filter((opcion) => opcion.valor !== "")}
                  onCambio={setTipoDocumento}
                  placeholder="Tipo"
                  etiquetaOculta
                />
                <Campo
                  id="datos-numero-documento"
                  etiqueta="Número de documento"
                  valor={numeroDocumento}
                  onCambio={setNumeroDocumento}
                  error={errores["numeroDocumento"] ?? null}
                  placeholder="N° de documento"
                  icono={<IconoTarjetaPersonal />}
                  etiquetaOculta
                  disabled={tipoDocumento === ""}
                  requerido={tipoDocumento !== ""}
                />
              </FilaUnida>
            </FilaCampos>
  
            <FilaCampos>
              <SelectorFecha
                id="datos-fecha-nacimiento"
                etiqueta="Fecha de nacimiento"
                valor={fechaNacimiento}
                onCambio={setFechaNacimiento}
                etiquetaOculta
              />
              {/* El correo identifica la cuenta y es la llave para entrar: cambiarlo
                  necesita verificarlo antes, y eso llega con las notificaciones. */}
              <Campo
                id="datos-correo"
                etiqueta="Correo electrónico"
                tipo="email"
                valor={perfil.data.email}
                onCambio={() => {}}
                placeholder="Correo electrónico"
                icono={<IconoCorreo />}
                etiquetaOculta
                disabled
              />
            </FilaCampos>
            <Boton tipo="submit" disabled={guardar.isPending}>
              {guardar.isPending ? "Guardando…" : "Guardar datos"}
            </Boton>
          </Formulario>
        </div>
        {pestana === "empresa" ? (
          // Campos de maqueta: todavia no se guardan. Quedan deshabilitados y
          // vacios hasta definir las columnas de la empresa en la base de datos.
          <Formulario ancho="completo" onSubmit={(evento) => evento.preventDefault()}>
            <Alerta>Muy pronto podrás guardar aquí los datos de tu empresa para tus facturas.</Alerta>
            <FilaCampos>
              <Campo
                id="empresa-ruc"
                etiqueta="RUC"
                valor={empresaRuc}
                onCambio={setEmpresaRuc}
                placeholder="RUC"
                icono={<IconoTarjetaPersonal />}
                etiquetaOculta
              />
              <Campo
                id="empresa-razon-social"
                etiqueta="Razón social"
                valor={empresaRazonSocial}
                onCambio={setEmpresaRazonSocial}
                placeholder="Razón social"
                icono={<IconoMarca />}
                etiquetaOculta
              />
            </FilaCampos>
            <FilaCampos>
              <Campo
                id="empresa-nombre-comercial"
                etiqueta="Nombre comercial"
                valor={empresaNombreComercial}
                onCambio={setEmpresaNombreComercial}
                placeholder="Nombre comercial"
                icono={<IconoEtiqueta />}
                etiquetaOculta
              />
              <Campo
                id="empresa-telefono"
                etiqueta="Teléfono de la empresa"
                tipo="tel"
                valor={empresaTelefonoEmpresa}
                onCambio={setEmpresaTelefonoEmpresa}
                placeholder="Teléfono de la empresa"
                icono={<IconoTelefono />}
                etiquetaOculta
              />
            </FilaCampos>
            <FilaCampos>
              <Campo
                id="empresa-direccion-fiscal"
                etiqueta="Dirección fiscal"
                valor={empresaDireccionFiscal}
                onCambio={setEmpresaDireccionFiscal}
                placeholder="Dirección fiscal"
                icono={<IconoUbicacion />}
                etiquetaOculta
              />
              <Campo
                id="empresa-correo-facturacion"
                etiqueta="Correo de facturación"
                tipo="email"
                valor={empresaCorreoFacturacion}
                onCambio={setEmpresaCorreoFacturacion}
                placeholder="Correo de facturación"
                icono={<IconoCorreo />}
                etiquetaOculta
              />
            </FilaCampos>
            <Boton tipo="submit" disabled>
              Guardar datos
            </Boton>
          </Formulario>
        ) : null}
      </Tarjeta>

      <TarjetaInfo
        titulo="Completa tu perfil"
        imagen={{
          src: "/ilustraciones/perfil-cuenta-v2.webp",
          alt: "Ilustración de un perfil con avatar, ficha personal y verificación.",
        }}
      >
        <p>Agrega tus datos para personalizar tu cuenta.</p>
      </TarjetaInfo>
    </FilaTarjetas>
  );
}
