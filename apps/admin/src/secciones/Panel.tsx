"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { Rol } from "@appweb/core";
import {
  DisposicionPanel,
  EstadoVacio,
  IconoCarrito,
  IconoConfiguracion,
  IconoEtiqueta,
  IconoMoneda,
  IconoPedidos,
  IconoUbicacion,
  IconoUsuario,
} from "@appweb/ui";

import { Resumen } from "./Resumen";
import { Usuarios } from "./Usuarios";
import { ColeccionPortada } from "./ColeccionPortada";

const ETIQUETAS: Record<string, string> = {
  resumen: "Resumen",
  pedidos: "Pedidos",
  envios: "Envíos",
  stock: "Stock",
  productos: "Productos",
  usuarios: "Usuarios",
  ajustes: "Ajustes",
};

const ICONOS: Record<string, ReactNode> = {
  resumen: <IconoMoneda />,
  pedidos: <IconoPedidos />,
  envios: <IconoUbicacion />,
  stock: <IconoEtiqueta />,
  productos: <IconoCarrito />,
  usuarios: <IconoUsuario />,
  ajustes: <IconoConfiguracion />,
};

export interface PropsPanel {
  /** Ya filtradas por rol en el servidor con `seccionesDelPanel`. */
  secciones: string[];
  /** "" = sin seccion en la URL: en movil se ve el menu. */
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
      setActiva(secciones.includes(desdeUrl) ? desdeUrl : "");
    }

    window.addEventListener("popstate", alNavegar);
    return () => window.removeEventListener("popstate", alNavegar);
  }, [secciones]);

  function ir(id: string) {
    setActiva(id);
    window.history.pushState(null, "", `/${id}`);
    window.scrollTo(0, 0);
  }

  async function salir() {
    await fetch("/api/sesion", { method: "DELETE" });
    window.location.href = `${process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000"}/ingresar`;
  }

  // En escritorio no hay pantalla de menu: sin seccion se ve la primera.
  const visible = activa || (secciones[0] ?? "resumen");

  return (
    <DisposicionPanel
      secciones={secciones.map((id) => ({ id, etiqueta: ETIQUETAS[id] ?? id, icono: ICONOS[id] }))}
      seccionActiva={activa}
      onSeccion={ir}
      nombreUsuario={nombre}
      rolUsuario={rol}
      onSalir={salir}
      hrefTienda={process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000"}
    >
      {visible === "resumen" ? (
        <Resumen />
      ) : visible === "usuarios" ? (
        <Usuarios usuarioIdActual={usuarioId} />
      ) : visible === "ajustes" ? (
        <ColeccionPortada />
      ) : (
        <EstadoVacio
          titulo={ETIQUETAS[visible] ?? visible}
          texto="Esta sección todavía no está construida."
        />
      )}
    </DisposicionPanel>
  );
}
