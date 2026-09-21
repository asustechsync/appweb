"use client";

import { useEffect, useState } from "react";

import { puede, type Rol } from "@appweb/core";
import { DisposicionCuenta } from "@appweb/ui";

import { Direcciones } from "./secciones/Direcciones";
import { Pedidos } from "./secciones/Pedidos";
import { Perfil } from "./secciones/Perfil";
import { Seguridad } from "./secciones/Seguridad";

const SECCIONES = [
  { id: "perfil", etiqueta: "Perfil" },
  { id: "direcciones", etiqueta: "Direcciones" },
  { id: "pedidos", etiqueta: "Pedidos" },
  { id: "seguridad", etiqueta: "Seguridad" },
];

const IDS = SECCIONES.map((seccion) => seccion.id);

export interface PropsMiCuenta {
  nombre: string;
  rol: Rol;
  seccionInicial: string;
}

/**
 * Shell de /mi-cuenta — CLASE C.
 *
 * Cambiar de seccion es estado del cliente mas `history.pushState`: la URL
 * sigue siendo compartible y el boton "atras" funciona, pero no hay viaje al
 * servidor. Los datos de cada seccion salen de la cache de TanStack Query.
 */
export function MiCuenta({ nombre, rol, seccionInicial }: PropsMiCuenta) {
  const [activa, setActiva] = useState(seccionInicial);
  const hrefPanel = puede(rol, "entrar_panel") ? (process.env["NEXT_PUBLIC_ADMIN_URL"] ?? "") : "";

  useEffect(() => {
    function alNavegar() {
      const desdeUrl = window.location.pathname.split("/")[2] ?? "";
      setActiva(IDS.includes(desdeUrl) ? desdeUrl : seccionInicial);
    }

    window.addEventListener("popstate", alNavegar);
    return () => window.removeEventListener("popstate", alNavegar);
  }, [seccionInicial]);

  function ir(id: string) {
    setActiva(id);
    window.history.pushState(null, "", `/mi-cuenta/${id}`);
  }

  async function salir() {
    await fetch("/api/sesion", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <DisposicionCuenta
      titulo="Mi cuenta"
      subtitulo={`Hola, ${nombre}`}
      nombreUsuario={nombre}
      rolUsuario={rol}
      secciones={SECCIONES}
      seccionActiva={activa}
      onSeccion={ir}
      onSalir={salir}
      hrefPanel={hrefPanel}
    >
      {activa === "direcciones" ? (
        <Direcciones />
      ) : activa === "pedidos" ? (
        <Pedidos />
      ) : activa === "seguridad" ? (
        <Seguridad />
      ) : (
        <Perfil />
      )}
    </DisposicionCuenta>
  );
}
