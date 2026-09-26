"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Alerta, Boton, Campo, Cargando, Tarjeta } from "@appweb/ui";
import { useTRPC } from "@/lib/trpc";

interface Contenido {
  etiqueta: string;
  titulo: string;
  texto: string;
  imagen: string;
  href: string;
}

const VACIO: Contenido = { etiqueta: "", titulo: "", texto: "", imagen: "", href: "" };

/** Editor del bloque de colección que aparece en la portada de la tienda. */
export function ColeccionPortada() {
  const trpc = useTRPC();
  const cliente = useQueryClient();
  const consulta = useQuery(trpc.panel.coleccionPortada.contenido.queryOptions());
  const [contenido, setContenido] = useState<Contenido>(VACIO);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorCache, setErrorCache] = useState<string | null>(null);

  useEffect(() => {
    if (consulta.data) setContenido(consulta.data);
  }, [consulta.data]);

  const guardar = useMutation(
      trpc.panel.coleccionPortada.guardar.mutationOptions({
        onSuccess: async () => {
          setAviso(null);
          setErrorCache(null);
          try {
            const respuesta = await fetch("/api/revalidar-portada", { method: "POST" });
            if (!respuesta.ok) throw new Error("Falló la actualización de la portada.");
            await cliente.invalidateQueries(trpc.panel.coleccionPortada.contenido.queryFilter());
          } catch {
            setErrorCache("El contenido se guardó, pero no se pudo actualizar la portada. Recarga la tienda más tarde.");
            return;
          }
          setAviso("La colección de portada se guardó y ya está actualizada.");
        },
      }),
  );

  function cambiar(campo: keyof Contenido, valor: string) {
    setContenido((actual) => ({ ...actual, [campo]: valor }));
    setAviso(null);
  }

  if (consulta.isPending) return <Cargando texto="Cargando la colección de portada…" />;
  if (consulta.isError) return <Alerta tono="error">{consulta.error.message}</Alerta>;

  return (
    <Tarjeta titulo="Colección de portada">
      <p>Este contenido aparece junto a los beneficios en la portada de la tienda.</p>
      <div className="ui-formulario ui-formulario--completo">
        <Campo id="coleccion-etiqueta" etiqueta="Etiqueta" valor={contenido.etiqueta} onCambio={(valor) => cambiar("etiqueta", valor)} requerido />
        <Campo id="coleccion-titulo" etiqueta="Título" valor={contenido.titulo} onCambio={(valor) => cambiar("titulo", valor)} requerido />
        <Campo id="coleccion-texto" etiqueta="Texto breve" valor={contenido.texto} onCambio={(valor) => cambiar("texto", valor)} requerido />
        <Campo id="coleccion-imagen" etiqueta="Ruta o URL de imagen" valor={contenido.imagen} onCambio={(valor) => cambiar("imagen", valor)} placeholder="/producto.webp" />
        <Campo id="coleccion-enlace" etiqueta="Enlace interno" valor={contenido.href} onCambio={(valor) => cambiar("href", valor)} requerido placeholder="/categorias/hombres" />
        <Boton
          tipo="button"
          disabled={guardar.isPending}
          onClick={() => guardar.mutate(contenido)}
        >
          {guardar.isPending ? "Guardando…" : "Guardar colección"}
        </Boton>
        {guardar.error ? <Alerta tono="error">{guardar.error.message}</Alerta> : null}
        {errorCache ? <Alerta tono="error">{errorCache}</Alerta> : null}
        {aviso ? <Alerta tono="exito">{aviso}</Alerta> : null}
      </div>
    </Tarjeta>
  );
}
