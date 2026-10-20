"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ETIQUETAS_ESTADO_RESENA, MAX_LETRAS_COMENTARIO, type EstadoResena } from "@appweb/core";
import {
  Alerta,
  Boton,
  Cargando,
  CampoTexto,
  EstadoVacio,
  Estrellas,
  FilaLista,
  Formulario,
  Insignia,
  SelectorEstrellas,
  Tarjeta,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

/** Verde publicada, ambar mientras espera revision, rojo si no se publico. */
function tonoDeEstado(estado: EstadoResena): "exito" | "alerta" | "error" {
  if (estado === "APROBADA") return "exito";
  if (estado === "PENDIENTE") return "alerta";
  return "error";
}

interface ResenaPropia {
  estrellas: number;
  comentario: string | null;
  estado: EstadoResena;
}

/**
 * Reseñas del cliente: los productos que ya recibio, con su reseña o el boton
 * para escribirla. Lo que se guarda espera revision antes de verse en la tienda.
 */
export function Resenas() {
  const trpc = useTRPC();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const lista = useQuery(trpc.cuenta.porResenar.queryOptions());

  if (lista.isPending) return <Cargando texto="Cargando tus productos…" />;
  if (lista.isError) return <Alerta tono="error">{lista.error.message}</Alerta>;

  if (lista.data.length === 0) {
    return (
      <EstadoVacio
        titulo="Aún no tienes productos por calificar"
        texto="Cuando recibas un pedido, aquí podrás contarnos qué te parecieron sus productos."
        textoAccion="Ver productos"
        hrefAccion="/"
      />
    );
  }

  const elegido = lista.data.find((p) => p.productoId === abierto) ?? null;

  return (
    <>
      {guardado ? (
        <Alerta tono="exito">Gracias. Tu reseña se publicará cuando la revisemos.</Alerta>
      ) : null}

      <Tarjeta titulo="Mis reseñas">
        {lista.data.map((producto) => {
          const editable = producto.resena?.estado !== "APROBADA";
          return (
            <FilaLista
              key={producto.productoId}
              acciones={
                editable ? (
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setGuardado(false);
                      setAbierto(abierto === producto.productoId ? null : producto.productoId);
                    }}
                  >
                    {abierto === producto.productoId
                      ? "Cerrar"
                      : producto.resena
                        ? "Editar"
                        : "Calificar"}
                  </Boton>
                ) : null
              }
            >
              <strong>{producto.nombre}</strong>
              {producto.resena ? (
                <>
                  <span>
                    <Estrellas valor={producto.resena.estrellas} tamano={14} />
                  </span>
                  <span>
                    <Insignia tono={tonoDeEstado(producto.resena.estado)}>
                      {ETIQUETAS_ESTADO_RESENA[producto.resena.estado]}
                    </Insignia>
                  </span>
                </>
              ) : (
                <span>Aún no lo calificas</span>
              )}
            </FilaLista>
          );
        })}
      </Tarjeta>

      {elegido ? (
        <FormularioResena
          key={elegido.productoId}
          productoId={elegido.productoId}
          nombre={elegido.nombre}
          actual={elegido.resena}
          onGuardada={() => {
            setAbierto(null);
            setGuardado(true);
          }}
        />
      ) : null}
    </>
  );
}

function FormularioResena({
  productoId,
  nombre,
  actual,
  onGuardada,
}: {
  productoId: string;
  nombre: string;
  actual: ResenaPropia | null;
  onGuardada: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [estrellas, setEstrellas] = useState(actual?.estrellas ?? 0);
  const [comentario, setComentario] = useState(actual?.comentario ?? "");
  const [errorEstrellas, setErrorEstrellas] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation(
    trpc.cuenta.guardarResena.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.cuenta.porResenar.pathFilter());
        onGuardada();
      },
      onError: (fallo) => setError(fallo.message),
    }),
  );

  return (
    <Tarjeta titulo={`Calificar ${nombre}`}>
      {actual?.estado === "RECHAZADA" ? (
        <Alerta tono="info">
          Tu reseña anterior no se publicó. Puedes corregirla y enviarla otra vez.
        </Alerta>
      ) : null}
      <Formulario
        ancho="completo"
        onSubmit={(evento) => {
          evento.preventDefault();
          if (estrellas === 0) {
            setErrorEstrellas("Elige de 1 a 5 estrellas");
            return;
          }
          setError(null);
          guardar.mutate({
            productoId,
            estrellas,
            ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
          });
        }}
      >
        <SelectorEstrellas
          id={`estrellas-${productoId}`}
          etiqueta="Tu calificación"
          valor={estrellas}
          onCambio={(valor) => {
            setEstrellas(valor);
            setErrorEstrellas(null);
          }}
          error={errorEstrellas}
          disabled={guardar.isPending}
        />
        <CampoTexto
          id={`comentario-${productoId}`}
          etiqueta={`Comentario (opcional, hasta ${MAX_LETRAS_COMENTARIO} caracteres)`}
          valor={comentario}
          onCambio={setComentario}
          placeholder="¿Cómo te quedó la talla? ¿Qué tal la tela después de lavarla?"
          error={error}
          filas={4}
          disabled={guardar.isPending}
        />
        <Boton tipo="submit" disabled={guardar.isPending}>
          {guardar.isPending ? "Enviando…" : "Enviar reseña"}
        </Boton>
      </Formulario>
    </Tarjeta>
  );
}
