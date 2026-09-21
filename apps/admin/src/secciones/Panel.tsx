"use client";

import { useEffect, useState } from "react";

import type { Rol } from "@appweb/core";
import { DisposicionPanel, EstadoVacio } from "@appweb/ui";

import { Resumen } from "./Resumen";
import { Usuarios } from "./Usuarios";

const ETIQUETAS: Record<string, string> = {
  resumen: "Resumen",
  pedidos: "Pedidos",
  envios: "Envíos",
  stock: "Stock",
  productos: "Productos",
  usuarios: "Usuarios",
  ajustes: "Ajustes",
};

export interface PropsPanel {
  /** Ya filtradas por rol en el servidor con `seccionesDelPanel`. */
  secciones: string[];
  seccionInicial: string;
  usuarioId: string;
  nombre: string;
  rol: Rol;
}

/**
 * Shell del panel — CLASE C.
 *
 * Cambiar de seccion es estado del cliente mas `history.pushState`: la URL
 * queda compartible y el boton "atras" funciona, pero no hay ni un viaje al
 * servidor. Los datos de cada seccion salen de la cache de TanStack Query.
 */
export function Panel({ secciones, seccionInicial, usuarioId, nombre, rol }: PropsPanel) {
  const [activa, setActiva] = useState(seccionInicial);

  useEffect(() => {
    function alNavegar() {
      const desdeUrl = window.location.pathname.replace(/^\/+/, "");
      setActiva(secciones.includes(desdeUrl) ? desdeUrl : seccionInicial);
    }

    window.addEventListener("popstate", alNavegar);
    return () => window.removeEventListener("popstate", alNavegar);
  }, [secciones, seccionInicial]);

  function ir(id: string) {
    setActiva(id);
    window.history.pushState(null, "", `/${id}`);
  }

  async function salir() {
    await fetch("/api/sesion", { method: "DELETE" });
    window.location.href = `${process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000"}/ingresar`;
  }

  return (
    <DisposicionPanel
      secciones={secciones.map((id) => ({ id, etiqueta: ETIQUETAS[id] ?? id }))}
      seccionActiva={activa}
      onSeccion={ir}
      nombreUsuario={nombre}
      rolUsuario={rol}
      onSalir={salir}
      hrefTienda={process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000"}
    >
      {activa === "resumen" ? (
        <Resumen />
      ) : activa === "usuarios" ? (
        <Usuarios usuarioIdActual={usuarioId} />
      ) : (
        <EstadoVacio
          titulo={ETIQUETAS[activa] ?? activa}
          texto="Esta sección todavía no está construida."
        />
      )}
    </DisposicionPanel>
  );
}
