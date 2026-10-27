"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS, evaluarClave, type EstadoPedido } from "@appweb/core";
import {
  Alerta,
  Boton,
  CabeceraDetalle,
  Campo,
  Cargando,
  CuadroBento,
  CuadroMonto,
  Formulario,
  IconoCorreo,
  IconoFlechaIzquierda,
  IconoPedidos,
  IconoReloj,
  IconoUsuario,
  IndicadorClave,
  ListaActividad,
  LogoIcono,
  RejillaBento,
  Tarjeta,
  TarjetaActividad,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

import { estadoDeCuenta } from "./CuadrosUsuario";
import { tonoDeEstado } from "./Pedidos";
import { FECHA, MONEDA, cuandoFue } from "@appweb/core/formato";

interface PropsDetalleUsuario {
  usuarioId: string;
  usuarioIdActual: string;
  etiquetaRol: (rol: string) => string;
  onVolver: () => void;
}

/**
 * Ficha de una cuenta: quien es, cuanto compro, y lo que el panel puede
 * corregir (contacto y clave). "Eliminar" anonimiza: borra sus datos
 * personales pero deja sus pedidos, que son ventas de la tienda.
 */
export function DetalleUsuario({
  usuarioId,
  usuarioIdActual,
  etiquetaRol,
  onVolver,
}: PropsDetalleUsuario) {
  const trpc = useTRPC();
  const consulta = useQuery(trpc.panel.usuarios.detalle.queryOptions({ usuarioId }));

  const volver = (
    <Boton variante="secundario" onClick={onVolver}>
      <IconoFlechaIzquierda tamano={16} />
      Volver a la lista
    </Boton>
  );

  if (consulta.isPending) return <Cargando texto="Cargando cuenta…" />;
  if (consulta.isError) {
    return (
      <Tarjeta acciones={volver}>
        <Alerta tono="error">{consulta.error.message}</Alerta>
      </Tarjeta>
    );
  }

  const u = consulta.data;
  const esUnoMismo = u.id === usuarioIdActual;

  return (
    <>
      <CabeceraDetalle titulo={u.nombre} acciones={volver} />

      <RejillaBento>
        <CuadroMonto
          logo={<LogoIcono icono={<IconoUsuario tamano={16} />} nombre={u.nombre} />}
          estado={estadoDeCuenta(u)}
          etiqueta={`${etiquetaRol(u.rol)} · ${u.nivel}`}
          monto={MONEDA.format(u.totalComprado)}
          detalle={`Cuenta desde ${FECHA.format(new Date(u.creadoEn))}`}
        />
        <CuadroBento
          icono={<IconoCorreo tamano={16} />}
          titulo="Cuenta"
          ancho="ancho"
          {...(u.anonimizada ? {} : { copiable: u.email })}
          detalle={u.telefono ?? "Sin teléfono"}
        >
          {u.anonimizada ? "Datos eliminados" : u.email}
        </CuadroBento>
        <CuadroBento
          icono={<IconoPedidos tamano={16} />}
          titulo="Compras"
          ancho="ancho"
          detalle={u.tieneDocumento ? "Con documento registrado" : "Sin documento"}
          cifras={[
            { valor: String(u.totalPedidos), etiqueta: "Pedidos" },
            { valor: String(u.direcciones), etiqueta: "Direcciones" },
          ]}
        >
          {u.nivel}
        </CuadroBento>
        <CuadroBento icono={<IconoReloj tamano={16} />} titulo="Último ingreso" ancho="ancho">
          {u.ultimoAccesoEn ? cuandoFue(new Date(u.ultimoAccesoEn)) : "Nunca ingresó"}
        </CuadroBento>
      </RejillaBento>

      {u.anonimizada ? null : (
        <>
          <EditarContacto
            usuarioId={u.id}
            inicial={{ nombre: u.nombre, email: u.email, telefono: u.telefono ?? "" }}
          />
          {esUnoMismo ? null : <PonerClave usuarioId={u.id} />}
        </>
      )}

      <ListaActividad titulo="Últimos pedidos" vacio="Esta cuenta todavía no compró.">
        {u.pedidos.map((p) => (
          <TarjetaActividad
            key={p.id}
            estado={ETIQUETAS[p.estado as EstadoPedido]}
            iconoEstado={<IconoPedidos tamano={12} />}
            tonoEstado={tonoDeEstado(p.estado as EstadoPedido)}
            fecha={cuandoFue(new Date(p.creadoEn))}
            logo={<LogoIcono icono={<IconoPedidos tamano={16} />} nombre="Pedido" />}
            titulo={p.codigo}
            valor={MONEDA.format(p.total)}
            anulado={p.estado === "CANCELADO"}
          />
        ))}
      </ListaActividad>

      {u.anonimizada || esUnoMismo ? null : (
        <EliminarCuenta usuarioId={u.id} nombre={u.nombre} onEliminada={onVolver} />
      )}
    </>
  );
}

// ── Contacto ────────────────────────────────────────────────────────────────

function EditarContacto({
  usuarioId,
  inicial,
}: {
  usuarioId: string;
  inicial: { nombre: string; email: string; telefono: string };
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(inicial.nombre);
  const [email, setEmail] = useState(inicial.email);
  const [telefono, setTelefono] = useState(inicial.telefono);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const editar = useMutation(
    trpc.panel.usuarios.editar.mutationOptions({
      onSuccess: () => {
        setError(null);
        setAviso("Datos guardados.");
        void queryClient.invalidateQueries(trpc.panel.usuarios.pathFilter());
      },
      onError: (fallo) => {
        setAviso(null);
        setError(fallo.message);
      },
    }),
  );

  return (
    <Tarjeta titulo="Datos de contacto">
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      <Formulario
        onSubmit={(evento) => {
          evento.preventDefault();
          editar.mutate({
            usuarioId,
            nombre,
            email,
            telefono: telefono.trim() === "" ? null : telefono.trim(),
          });
        }}
      >
        <Campo
          id="usuario-nombre"
          etiqueta="Nombre"
          valor={nombre}
          onCambio={setNombre}
          requerido
        />
        <Campo
          id="usuario-email"
          etiqueta="Correo"
          tipo="email"
          valor={email}
          onCambio={setEmail}
          requerido
        />
        <Campo
          id="usuario-telefono"
          etiqueta="Teléfono (opcional)"
          tipo="tel"
          bandera="pe"
          prefijo="+51"
          valor={telefono}
          onCambio={setTelefono}
          placeholder="9XXXXXXXX"
        />
        <Boton tipo="submit" disabled={editar.isPending}>
          {editar.isPending ? "Guardando…" : "Guardar datos"}
        </Boton>
      </Formulario>
    </Tarjeta>
  );
}

// ── Clave ───────────────────────────────────────────────────────────────────

function PonerClave({ usuarioId }: { usuarioId: string }) {
  const trpc = useTRPC();
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const poner = useMutation(
    trpc.panel.usuarios.ponerClave.mutationOptions({
      onSuccess: () => {
        setError(null);
        setClave("");
        setAviso("Clave cambiada. Pásasela a la persona por un medio seguro.");
      },
      onError: (fallo) => {
        setAviso(null);
        setError(fallo.message);
      },
    }),
  );

  return (
    <Tarjeta titulo="Poner una clave nueva">
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      <Formulario
        onSubmit={(evento) => {
          evento.preventDefault();
          poner.mutate({ usuarioId, clave });
        }}
      >
        <p>
          Para clientes es mejor que usen “¿Olvidaste tu contraseña?” en la tienda: les llega un
          enlace por correo. Esto sirve para el equipo.
        </p>
        <Campo
          id="usuario-clave"
          etiqueta="Clave nueva"
          tipo="password"
          valor={clave}
          onCambio={setClave}
          autoComplete="new-password"
          requerido
        />
        <IndicadorClave requisitos={evaluarClave(clave)} vacia={clave === ""} />
        <Boton tipo="submit" variante="secundario" disabled={poner.isPending || clave === ""}>
          {poner.isPending ? "Guardando…" : "Cambiar clave"}
        </Boton>
      </Formulario>
    </Tarjeta>
  );
}

// ── Eliminar ────────────────────────────────────────────────────────────────

function EliminarCuenta({
  usuarioId,
  nombre,
  onEliminada,
}: {
  usuarioId: string;
  nombre: string;
  onEliminada: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anonimizar = useMutation(
    trpc.panel.usuarios.anonimizar.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.panel.usuarios.pathFilter());
        onEliminada();
      },
      onError: (fallo) => setError(fallo.message),
    }),
  );

  return (
    <Tarjeta titulo="Eliminar cuenta">
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <p>
        Se borran su nombre, correo, teléfono, documento y direcciones, y ya no podrá ingresar. Sus
        pedidos se conservan sin datos personales. No se puede deshacer.
      </p>
      {confirmando ? (
        <>
          <Alerta tono="error">¿Seguro que quieres eliminar la cuenta de {nombre}?</Alerta>
          <Boton disabled={anonimizar.isPending} onClick={() => anonimizar.mutate({ usuarioId })}>
            {anonimizar.isPending ? "Eliminando…" : "Sí, eliminar"}
          </Boton>
          <Boton variante="secundario" onClick={() => setConfirmando(false)}>
            No, volver
          </Boton>
        </>
      ) : (
        <Boton variante="secundario" onClick={() => setConfirmando(true)}>
          Eliminar cuenta
        </Boton>
      )}
    </Tarjeta>
  );
}
