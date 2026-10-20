"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS_ESTADO_RESENA, type DecisionResena, type EstadoResena } from "@appweb/core";
import {
  Alerta,
  Boton,
  Cargando,
  EstadoVacio,
  Estrellas,
  FilaLista,
  Insignia,
  Pestanas,
  Tarjeta,
} from "@appweb/ui";

import { revalidarTienda } from "@/lib/revalidar";
import { useTRPC } from "@/lib/trpc";

import { FECHA_HORA } from "@appweb/core/formato";

const PESTANAS: { id: EstadoResena | "TODAS"; etiqueta: string }[] = [
  { id: "PENDIENTE", etiqueta: "Por revisar" },
  { id: "APROBADA", etiqueta: "Publicadas" },
  { id: "RECHAZADA", etiqueta: "No publicadas" },
  { id: "TODAS", etiqueta: "Todas" },
];

function tonoDeEstado(estado: EstadoResena): "exito" | "alerta" | "error" {
  if (estado === "APROBADA") return "exito";
  if (estado === "PENDIENTE") return "alerta";
  return "error";
}

/**
 * Reseñas: la cola de lo que escribieron los clientes. Nada sale en la tienda
 * sin pasar por aqui. Publicar o retirar una reseña regenera la ficha y los
 * listados de ese producto.
 */
export function Resenas() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [pestana, setPestana] = useState<EstadoResena | "TODAS">("PENDIENTE");
  const [aviso, setAviso] = useState<{ tono: "exito" | "info" | "error"; texto: string } | null>(
    null,
  );

  const lista = useQuery(
    trpc.panel.resenas.listar.queryOptions(pestana === "TODAS" ? {} : { estado: pestana }),
  );

  const moderar = useMutation(
    trpc.panel.resenas.moderar.mutationOptions({
      onSuccess: async (r, entrada) => {
        void queryClient.invalidateQueries(trpc.panel.resenas.pathFilter());
        void queryClient.invalidateQueries(trpc.panel.avisos.pathFilter());
        const tiendaAlDia = await revalidarTienda(r.revalidar);
        const hecho = entrada.estado === "APROBADA" ? "Reseña publicada." : "Reseña retirada.";
        setAviso(
          tiendaAlDia
            ? { tono: "exito", texto: hecho }
            : {
                tono: "info",
                texto: `${hecho} La tienda tardará unos minutos en mostrar el cambio.`,
              },
        );
      },
      onError: (fallo) => setAviso({ tono: "error", texto: fallo.message }),
    }),
  );

  function decidir(resenaId: string, estado: DecisionResena) {
    setAviso(null);
    moderar.mutate({ resenaId, estado });
  }

  const conteo = lista.data?.porEstado;
  const opciones = PESTANAS.map((p) => {
    const cantidad = conteo && p.id !== "TODAS" ? conteo[p.id] : 0;
    return { id: p.id, etiqueta: cantidad > 0 ? `${p.etiqueta} (${cantidad})` : p.etiqueta };
  });

  return (
    <>
      {aviso ? <Alerta tono={aviso.tono}>{aviso.texto}</Alerta> : null}

      <Tarjeta titulo="Reseñas">
        <Pestanas
          etiqueta="Estado de la reseña"
          opciones={opciones}
          activa={pestana}
          onCambio={(id) => setPestana(id as EstadoResena | "TODAS")}
        />

        {lista.isPending ? (
          <Cargando texto="Cargando reseñas…" />
        ) : lista.isError ? (
          <Alerta tono="error">{lista.error.message}</Alerta>
        ) : lista.data.resenas.length === 0 ? (
          <EstadoVacio titulo="Sin reseñas" texto="No hay reseñas en este estado." />
        ) : (
          lista.data.resenas.map((r) => (
            <FilaLista
              key={r.id}
              acciones={
                <>
                  {r.estado !== "APROBADA" ? (
                    <Boton disabled={moderar.isPending} onClick={() => decidir(r.id, "APROBADA")}>
                      Publicar
                    </Boton>
                  ) : null}
                  {r.estado !== "RECHAZADA" ? (
                    <Boton
                      variante="secundario"
                      disabled={moderar.isPending}
                      onClick={() => decidir(r.id, "RECHAZADA")}
                    >
                      {r.estado === "APROBADA" ? "Retirar" : "No publicar"}
                    </Boton>
                  ) : null}
                </>
              }
            >
              <strong>{r.producto}</strong>
              <span>
                <Estrellas valor={r.estrellas} tamano={14} />
              </span>
              <span>{r.comentario ?? "Sin comentario, solo estrellas."}</span>
              <span>
                {r.autor} · {r.email} · {FECHA_HORA.format(new Date(r.creadoEn))}
              </span>
              <span>
                <Insignia tono={tonoDeEstado(r.estado)}>
                  {ETIQUETAS_ESTADO_RESENA[r.estado]}
                </Insignia>
                {r.moderadoPor && r.moderadoEn
                  ? ` · ${r.moderadoPor}, ${FECHA_HORA.format(new Date(r.moderadoEn))}`
                  : null}
              </span>
            </FilaLista>
          ))
        )}
      </Tarjeta>
    </>
  );
}
