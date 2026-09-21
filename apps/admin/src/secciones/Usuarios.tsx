"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ROLES, type Rol } from "@appweb/core";
import {
  Alerta,
  Boton,
  Campo,
  CampoSelect,
  Cargando,
  EstadoVacio,
  FilaLista,
  Formulario,
  Insignia,
  Tarjeta,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

const ETIQUETA_ROL: Record<Rol, string> = {
  CLIENTE: "Cliente",
  VENDEDOR: "Vendedor",
  ALMACEN: "Almacén",
  ADMIN: "Administrador",
};

const OPCIONES_ROL = ROLES.map((rol) => ({ valor: rol, etiqueta: ETIQUETA_ROL[rol] }));

/**
 * Seccion de usuarios: alta de cuentas, cambio de rol y baja.
 *
 * Ninguna regla se decide aqui — quien puede cambiar que lo resuelve
 * @appweb/api con `exige("gestionar_usuarios")` y @appweb/core con
 * `revisarCambioRol`. Esta pantalla solo muestra el mensaje que le devuelven.
 */
export function Usuarios({ usuarioIdActual }: { usuarioIdActual: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rolNuevo, setRolNuevo] = useState<string>("VENDEDOR");

  const lista = useQuery(trpc.panel.usuarios.listar.queryOptions());

  /** El filtro es local: la lista ya esta en la cache y escribir no debe
      provocar una consulta por tecla. */
  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (termino === "" || lista.data === undefined) return lista.data ?? [];

    return lista.data.filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(termino) ||
        usuario.email.toLowerCase().includes(termino),
    );
  }, [busqueda, lista.data]);

  function refrescar() {
    void queryClient.invalidateQueries(trpc.panel.usuarios.pathFilter());
  }

  function alFallar(fallo: unknown) {
    setAviso(null);
    setError(fallo instanceof Error ? fallo.message : "No se pudo completar la acción.");
  }

  const crear = useMutation(
    trpc.panel.usuarios.crear.mutationOptions({
      onSuccess: (usuario) => {
        setError(null);
        setAviso(`Cuenta creada para ${usuario.email}.`);
        setNombre("");
        setEmail("");
        setClave("");
        setTelefono("");
        setRolNuevo("VENDEDOR");
        setCreando(false);
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const cambiarRol = useMutation(
    trpc.panel.usuarios.cambiarRol.mutationOptions({
      onSuccess: (usuario) => {
        setError(null);
        setAviso(`${usuario.nombre} ahora es ${ETIQUETA_ROL[usuario.rol as Rol]}.`);
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const cambiarActivo = useMutation(
    trpc.panel.usuarios.cambiarActivo.mutationOptions({
      onSuccess: (usuario) => {
        setError(null);
        setAviso(`${usuario.nombre} quedó ${usuario.activo ? "activo" : "desactivado"}.`);
        refrescar();
      },
      onError: alFallar,
    }),
  );

  const trabajando = crear.isPending || cambiarRol.isPending || cambiarActivo.isPending;

  return (
    <>
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}

      <Tarjeta
        titulo="Crear cuenta"
        acciones={
          <Boton variante="secundario" onClick={() => setCreando((valor) => !valor)}>
            {creando ? "Cancelar" : "+ Nueva cuenta"}
          </Boton>
        }
      >
        {creando ? (
          <Formulario
            onSubmit={(evento) => {
              evento.preventDefault();
              crear.mutate({
                nombre,
                email,
                clave,
                rol: rolNuevo as Rol,
                ...(telefono.trim() === "" ? {} : { telefono }),
              });
            }}
          >
            <Campo id="nuevo-nombre" etiqueta="Nombre" valor={nombre} onCambio={setNombre} requerido />
            <Campo
              id="nuevo-email"
              etiqueta="Correo"
              tipo="email"
              valor={email}
              onCambio={setEmail}
              requerido
            />
            <Campo
              id="nueva-clave"
              etiqueta="Clave"
              tipo="password"
              valor={clave}
              onCambio={setClave}
              placeholder="Mínimo 8 caracteres"
              requerido
            />
            <Campo
              id="nuevo-telefono"
              etiqueta="Teléfono (opcional)"
              tipo="tel"
              bandera="pe"
              prefijo="+51"
              valor={telefono}
              onCambio={setTelefono}
              placeholder="9XXXXXXXX"
            />
            <CampoSelect
              id="nuevo-rol"
              etiqueta="Rol"
              valor={rolNuevo}
              opciones={OPCIONES_ROL}
              onCambio={setRolNuevo}
            />
            <Boton tipo="submit" disabled={crear.isPending}>
              {crear.isPending ? "Creando…" : "Crear cuenta"}
            </Boton>
          </Formulario>
        ) : (
          <p>Las cuentas del equipo se crean aquí con su rol. El público se registra por su cuenta como cliente.</p>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Cuentas"
        acciones={
          <Campo
            id="busqueda-usuarios"
            etiqueta="Buscar por nombre o correo"
            valor={busqueda}
            onCambio={setBusqueda}
            placeholder="Buscar…"
          />
        }
      >
        {lista.isPending ? (
          <Cargando texto="Cargando cuentas…" />
        ) : lista.isError ? (
          <Alerta tono="error">{lista.error.message}</Alerta>
        ) : visibles.length === 0 ? (
          <EstadoVacio
            titulo="Sin resultados"
            texto="Ninguna cuenta coincide con esa búsqueda."
          />
        ) : (
          visibles.map((usuario) => {
            const esUnoMismo = usuario.id === usuarioIdActual;

            return (
              <FilaLista
                key={usuario.id}
                acciones={
                  <>
                    <CampoSelect
                      id={`rol-${usuario.id}`}
                      etiqueta={`Rol de ${usuario.nombre}`}
                      etiquetaOculta
                      valor={usuario.rol}
                      opciones={OPCIONES_ROL}
                      onCambio={(rol) =>
                        cambiarRol.mutate({ usuarioId: usuario.id, rol: rol as Rol })
                      }
                      disabled={esUnoMismo || trabajando}
                    />
                    <Boton
                      variante="secundario"
                      disabled={esUnoMismo || trabajando}
                      onClick={() =>
                        cambiarActivo.mutate({ usuarioId: usuario.id, activo: !usuario.activo })
                      }
                    >
                      {usuario.activo ? "Desactivar" : "Activar"}
                    </Boton>
                  </>
                }
              >
                <strong>
                  {usuario.nombre}
                  {esUnoMismo ? " (tú)" : ""}
                </strong>
                <span>{usuario.email}</span>
                <span>
                  <Insignia tono="marca">{ETIQUETA_ROL[usuario.rol as Rol]}</Insignia>{" "}
                  <Insignia tono={usuario.activo ? "exito" : "alerta"}>
                    {usuario.activo ? "Activo" : "Desactivado"}
                  </Insignia>
                </span>
              </FilaLista>
            );
          })
        )}
      </Tarjeta>
    </>
  );
}
