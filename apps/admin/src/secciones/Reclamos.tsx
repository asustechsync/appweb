"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ETIQUETA_TIPO_DOCUMENTO,
  ETIQUETAS_ESTADO_RECLAMO,
  ETIQUETAS_TIPO_BIEN,
  ETIQUETAS_TIPO_RECLAMO,
  type EstadoReclamo,
} from "@appweb/core";
import {
  Alerta,
  BloqueDetalle,
  Boton,
  Cargando,
  CampoTexto,
  EstadoVacio,
  FilaDetalles,
  FilaLista,
  Formulario,
  Insignia,
  Pestanas,
  Tarjeta,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

import { FECHA, FECHA_HORA, MONEDA } from "@appweb/core/formato";

const PESTANAS: { id: EstadoReclamo | "TODOS"; etiqueta: string }[] = [
  { id: "PENDIENTE", etiqueta: "Por responder" },
  { id: "RESPONDIDO", etiqueta: "Respondidos" },
  { id: "TODOS", etiqueta: "Todos" },
];

/** Rojo si ya vencio o vence en dos dias; ambar mientras corre; verde respondido. */
function plazo(estado: EstadoReclamo, dias: number | null, vence: string) {
  if (estado === "RESPONDIDO" || dias === null) {
    return { tono: "exito" as const, texto: ETIQUETAS_ESTADO_RECLAMO[estado] };
  }
  if (dias < 0)
    return { tono: "error" as const, texto: `Venció el ${FECHA.format(new Date(vence))}` };
  const texto =
    dias === 0
      ? "Vence hoy"
      : `Vence en ${dias} ${dias === 1 ? "día" : "días"} · ${FECHA.format(new Date(vence))}`;
  return { tono: dias <= 2 ? ("error" as const) : ("alerta" as const), texto };
}

/**
 * Libro de Reclamaciones: hojas por responder, con el plazo legal a la vista.
 * La hoja no se edita; lo unico que se escribe aqui es la respuesta, y llega
 * al consumidor por correo.
 */
export function Reclamos() {
  const trpc = useTRPC();
  const [pestana, setPestana] = useState<EstadoReclamo | "TODOS">("PENDIENTE");
  const [abierto, setAbierto] = useState<string | null>(null);

  const lista = useQuery(
    trpc.panel.reclamos.listar.queryOptions(pestana === "TODOS" ? {} : { estado: pestana }),
  );

  if (abierto !== null) {
    return <DetalleReclamo reclamoId={abierto} onVolver={() => setAbierto(null)} />;
  }

  const conteo = lista.data?.porEstado;
  const opciones = PESTANAS.map((p) => {
    const cantidad = conteo && p.id !== "TODOS" ? conteo[p.id] : 0;
    return { id: p.id, etiqueta: cantidad > 0 ? `${p.etiqueta} (${cantidad})` : p.etiqueta };
  });

  return (
    <Tarjeta titulo="Libro de Reclamaciones">
      <Pestanas
        etiqueta="Estado del reclamo"
        opciones={opciones}
        activa={pestana}
        onCambio={(id) => setPestana(id as EstadoReclamo | "TODOS")}
      />

      {lista.isPending ? (
        <Cargando texto="Cargando reclamos…" />
      ) : lista.isError ? (
        <Alerta tono="error">{lista.error.message}</Alerta>
      ) : lista.data.reclamos.length === 0 ? (
        <EstadoVacio titulo="Sin reclamos" texto="No hay hojas en este estado." />
      ) : (
        lista.data.reclamos.map((r) => {
          const p = plazo(r.estado, r.diasParaVencer, r.vence);
          return (
            <FilaLista
              key={r.id}
              acciones={
                <Boton variante="secundario" onClick={() => setAbierto(r.id)}>
                  {r.estado === "PENDIENTE" ? "Responder" : "Ver hoja"}
                </Boton>
              }
            >
              <strong>
                {ETIQUETAS_TIPO_RECLAMO[r.tipo]} N.° {r.codigo}
              </strong>
              <span>
                {r.nombre} · {r.email}
              </span>
              <span>
                {FECHA_HORA.format(new Date(r.creadoEn))} · {r.descripcionBien}
              </span>
              <span>
                <Insignia tono={p.tono}>{p.texto}</Insignia>
              </span>
            </FilaLista>
          );
        })
      )}
    </Tarjeta>
  );
}

function DetalleReclamo({ reclamoId, onVolver }: { reclamoId: string; onVolver: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const consulta = useQuery(trpc.panel.reclamos.detalle.queryOptions({ reclamoId }));
  const [respuesta, setRespuesta] = useState("");
  const [error, setError] = useState<string | null>(null);

  const responder = useMutation(
    trpc.panel.reclamos.responder.mutationOptions({
      onSuccess: () => {
        setError(null);
        setRespuesta("");
        void queryClient.invalidateQueries(trpc.panel.reclamos.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.avisos.pathFilter());
      },
      onError: (fallo) => setError(fallo.message),
    }),
  );

  const volver = (
    <Boton variante="secundario" onClick={onVolver}>
      ← Volver a reclamos
    </Boton>
  );

  if (consulta.isPending) return <Cargando texto="Cargando hoja…" />;
  if (consulta.isError) {
    return (
      <Tarjeta acciones={volver}>
        <Alerta tono="error">{consulta.error.message}</Alerta>
      </Tarjeta>
    );
  }

  const r = consulta.data;
  const p = plazo(r.estado, r.diasParaVencer, r.vence);

  return (
    <>
      {responder.isSuccess ? (
        <Alerta tono="exito">Respuesta guardada y enviada a {r.email}.</Alerta>
      ) : null}

      <Tarjeta titulo={`${ETIQUETAS_TIPO_RECLAMO[r.tipo]} N.° ${r.codigo}`} acciones={volver}>
        <p>
          <Insignia tono={p.tono}>{p.texto}</Insignia> Registrado el{" "}
          {FECHA_HORA.format(new Date(r.creadoEn))}
        </p>
      </Tarjeta>

      <FilaDetalles>
        <BloqueDetalle titulo="Consumidor">
          <p>{r.nombre}</p>
          <p>
            {ETIQUETA_TIPO_DOCUMENTO[r.tipoDocumento]} {r.numeroDocumento}
          </p>
          <p>{r.domicilio}</p>
          <p>
            {r.telefono} · {r.email}
          </p>
          {r.menorDeEdad ? <p>Menor de edad · Apoderado: {r.apoderado}</p> : null}
        </BloqueDetalle>
        <BloqueDetalle titulo={ETIQUETAS_TIPO_BIEN[r.tipoBien]}>
          <p>{r.descripcionBien}</p>
          {r.pedidoCodigo ? <p>Pedido {r.pedidoCodigo}</p> : null}
          {r.monto !== null ? <p>Monto reclamado: {MONEDA.format(r.monto)}</p> : null}
        </BloqueDetalle>
      </FilaDetalles>

      <Tarjeta titulo="Detalle">
        <p>{r.detalle}</p>
      </Tarjeta>
      <Tarjeta titulo="Lo que pide">
        <p>{r.pedido}</p>
      </Tarjeta>

      {r.estado === "RESPONDIDO" ? (
        <Tarjeta titulo="Respuesta">
          <p>{r.respuesta}</p>
          <p>
            {r.respondidoPor ?? "—"} ·{" "}
            {r.respondidoEn ? FECHA_HORA.format(new Date(r.respondidoEn)) : ""}
          </p>
        </Tarjeta>
      ) : (
        <Tarjeta titulo="Responder">
          <Formulario
            ancho="completo"
            onSubmit={(evento) => {
              evento.preventDefault();
              responder.mutate({ reclamoId: r.id, respuesta });
            }}
          >
            <p>
              Explica qué se hizo o qué se ofrece. La respuesta se envía a {r.email} y no se puede
              cambiar después.
            </p>
            <CampoTexto
              id="respuesta-reclamo"
              etiqueta="Respuesta al consumidor"
              valor={respuesta}
              onCambio={setRespuesta}
              error={error}
              filas={6}
              requerido
            />
            <Boton tipo="submit" disabled={responder.isPending || respuesta.trim() === ""}>
              {responder.isPending ? "Enviando…" : "Enviar respuesta"}
            </Boton>
          </Formulario>
        </Tarjeta>
      )}
    </>
  );
}
