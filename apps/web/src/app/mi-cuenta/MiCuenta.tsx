"use client";

import { useEffect, useState } from "react";

import { puede, type Rol } from "@appweb/core";
import {
  DisposicionCuenta,
  IconoEscudo,
  IconoConfiguracion,
  IconoPedidos,
  IconoSoporte,
  IconoUbicacion,
  IconoPerfil,
  IconoPremio,
  IconoFavorito,
  MenuCuenta,
  type GrupoMenuCuenta,
} from "@appweb/ui";

import { Beneficios } from "./secciones/Beneficios";
import { Configuracion } from "./secciones/Configuracion";
import { Favoritos } from "./secciones/Favoritos";
import { Direcciones } from "./secciones/Direcciones";
import { Pedidos } from "./secciones/Pedidos";
import { Perfil } from "./secciones/Perfil";
import { Seguridad } from "./secciones/Seguridad";

const SECCIONES = [
  { id: "perfil", etiqueta: "Perfil" },
  { id: "direcciones", etiqueta: "Direcciones" },
  { id: "pedidos", etiqueta: "Pedidos" },
  { id: "beneficios", etiqueta: "Beneficios" },
  { id: "favoritos", etiqueta: "Favoritos" },
  { id: "seguridad", etiqueta: "Seguridad" },
  { id: "configuracion", etiqueta: "Configuración" },
  { id: "soporte", etiqueta: "Soporte", href: "/ayuda/contacto" },
];

const IDS = SECCIONES.filter((seccion) => !seccion.href).map((seccion) => seccion.id);

/** Menu de ajustes en movil. Las secciones abren dentro de la cuenta. */
const GRUPOS_MENU: GrupoMenuCuenta[] = [
  {
    opciones: [
      { id: "perfil", etiqueta: "Perfil", icono: <IconoPerfil />, seccion: "perfil" },
      { id: "direcciones", etiqueta: "Direcciones", icono: <IconoUbicacion />, seccion: "direcciones" },
      { id: "seguridad", etiqueta: "Seguridad", icono: <IconoEscudo />, seccion: "seguridad" },
      { id: "pedidos", etiqueta: "Mis pedidos", icono: <IconoPedidos />, seccion: "pedidos" },
      { id: "favoritos", etiqueta: "Favoritos", icono: <IconoFavorito />, seccion: "favoritos" },
      { id: "beneficios", etiqueta: "Beneficios", icono: <IconoPremio />, seccion: "beneficios" },
    ],
  },
  {
    opciones: [
      { id: "soporte", etiqueta: "Soporte", icono: <IconoSoporte />, href: "/ayuda/contacto" },
      { id: "configuracion", etiqueta: "Configuración", icono: <IconoConfiguracion />, seccion: "configuracion" },
    ],
  },
];

export interface PropsMiCuenta {
  nombre: string;
  rol: Rol;
  /** "" = sin seccion en la URL: en movil se ve el menu. */
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
      setActiva(IDS.includes(desdeUrl) ? desdeUrl : "");
    }

    window.addEventListener("popstate", alNavegar);
    return () => window.removeEventListener("popstate", alNavegar);
  }, []);

  function ir(id: string) {
    setActiva(id);
    window.history.pushState(null, "", id ? `/mi-cuenta/${id}` : "/mi-cuenta");
    window.scrollTo(0, 0);
  }

  async function salir() {
    await fetch("/api/sesion", { method: "DELETE" });
    window.location.href = "/";
  }

  // En escritorio no hay pantalla de menu: sin seccion se ve el perfil.
  const visible = activa || "perfil";
  const tituloSeccion = GRUPOS_MENU.flatMap((grupo) => grupo.opciones).find((opcion) => opcion.id === visible)?.etiqueta ?? "Mi cuenta";

  return (
    <DisposicionCuenta
      titulo="Mi cuenta"
      subtitulo={`Hola, ${nombre}`}
      nombreUsuario={nombre}
      rolUsuario={rol}
      secciones={SECCIONES}
      seccionActiva={visible}
      onSeccion={ir}
      onSalir={salir}
      hrefPanel={hrefPanel}
      enMenu={activa === ""}
      tituloSeccion={tituloSeccion}
      onVolver={() => ir("")}
      menuMovil={
        <MenuCuenta
          nombreUsuario={nombre}
          descripcionUsuario="Ver mis datos personales"
          seccionUsuario="perfil"
          grupos={GRUPOS_MENU}
          onSeccion={ir}
          onSalir={salir}
        />
      }
    >
      {visible === "direcciones" ? (
        <Direcciones />
      ) : visible === "pedidos" ? (
        <Pedidos />
      ) : visible === "favoritos" ? (
        <Favoritos />
      ) : visible === "beneficios" ? (
        <Beneficios />
      ) : visible === "seguridad" ? (
        <Seguridad />
      ) : visible === "configuracion" ? (
        <Configuracion />
      ) : (
        <Perfil />
      )}
    </DisposicionCuenta>
  );
}
