"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  Alerta,
  Boton,
  Campo,
  Cargando,
  EstadoVacio,
  FilaLista,
  Insignia,
  Pestanas,
  Tarjeta,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

import { EditorProducto } from "./EditorProducto";
import { MONEDA } from "@appweb/core/formato";

type Filtro = "TODOS" | "VISIBLES" | "OCULTOS";

/** "nuevo" abre el formulario vacio; un id abre ese producto. */
type Abierto = null | "nuevo" | string;

/**
 * Seccion de productos: el catalogo completo y, al abrir uno, su editor.
 *
 * Que es un precio valido, como se arma el SKU o si una variante esta
 * repetida lo deciden @appweb/core y @appweb/api; aqui solo se muestra y se
 * envia.
 */
export function Productos() {
  const trpc = useTRPC();
  const [abierto, setAbierto] = useState<Abierto>(null);
  // El editor se vuelve a montar al pasar de "nuevo" al id creado: el aviso
  // de exito se recuerda aqui para no perderlo en ese cambio.
  const [recienCreado, setRecienCreado] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [busqueda, setBusqueda] = useState("");

  const lista = useQuery(trpc.panel.productos.listar.queryOptions());

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return (lista.data ?? []).filter((p) => {
      if (filtro === "VISIBLES" && !p.activo) return false;
      if (filtro === "OCULTOS" && p.activo) return false;
      if (termino === "") return true;
      return (
        p.nombre.toLowerCase().includes(termino) ||
        p.slug.includes(termino) ||
        (p.marca ?? "").toLowerCase().includes(termino)
      );
    });
  }, [busqueda, filtro, lista.data]);

  if (abierto !== null) {
    return (
      <EditorProducto
        productoId={abierto === "nuevo" ? null : abierto}
        recienCreado={abierto !== "nuevo" && abierto === recienCreado}
        onCreado={(id) => {
          setRecienCreado(id);
          setAbierto(id);
        }}
        onVolver={() => setAbierto(null)}
      />
    );
  }

  const ocultos = (lista.data ?? []).filter((p) => !p.activo).length;

  return (
    <Tarjeta
      titulo="Productos"
      acciones={<Boton onClick={() => setAbierto("nuevo")}>+ Nuevo producto</Boton>}
    >
      <Campo
        id="busqueda-productos"
        etiqueta="Buscar por nombre, marca o dirección web"
        valor={busqueda}
        onCambio={setBusqueda}
        placeholder="Buscar…"
      />
      <Pestanas
        etiqueta="Visibilidad"
        opciones={[
          { id: "TODOS", etiqueta: "Todos" },
          { id: "VISIBLES", etiqueta: "En la tienda" },
          { id: "OCULTOS", etiqueta: ocultos > 0 ? `Ocultos (${ocultos})` : "Ocultos" },
        ]}
        activa={filtro}
        onCambio={(id) => setFiltro(id as Filtro)}
      />

      {lista.isPending ? (
        <Cargando texto="Cargando productos…" />
      ) : lista.isError ? (
        <Alerta tono="error">{lista.error.message}</Alerta>
      ) : visibles.length === 0 ? (
        <EstadoVacio
          titulo="Sin productos"
          texto={busqueda ? "Ningún producto coincide con esa búsqueda." : "No hay productos aquí."}
        />
      ) : (
        visibles.map((p) => (
          <FilaLista
            key={p.id}
            acciones={
              <Boton variante="secundario" onClick={() => setAbierto(p.id)}>
                Editar
              </Boton>
            }
          >
            <strong>{p.nombre}</strong>
            <span>
              {MONEDA.format(p.precio)}
              {p.precioLista !== null ? ` · antes ${MONEDA.format(p.precioLista)}` : ""} ·{" "}
              {p.categoria}
              {p.marca ? ` · ${p.marca}` : ""}
            </span>
            <span>
              <Insignia tono={p.activo ? "exito" : "alerta"}>
                {p.activo ? "En la tienda" : "Oculto"}
              </Insignia>{" "}
              <Insignia tono={p.stockTotal === 0 ? "error" : "neutro"}>
                {p.variantes} {p.variantes === 1 ? "variante" : "variantes"} · {p.stockTotal} u.
              </Insignia>
              {p.destacado ? (
                <>
                  {" "}
                  <Insignia tono="marca">Destacado</Insignia>
                </>
              ) : null}
            </span>
          </FilaLista>
        ))
      )}
    </Tarjeta>
  );
}
