"use client";

import { useEffect, useState, type ReactNode } from "react";

import { puede, type Rol } from "@appweb/core";
import {
  Alerta,
  Boton,
  DisposicionPanel,
  EstadoVacio,
  IconoCarrito,
  IconoConfiguracion,
  IconoEtiqueta,
  IconoLibro,
  IconoMoneda,
  IconoPedidos,
  IconoUbicacion,
  IconoUsuario,
} from "@appweb/ui";

import { useAvisos } from "@/lib/use-avisos";

import { Ajustes } from "./Ajustes";
import { Envios } from "./Envios";
import { Pedidos } from "./Pedidos";
import { Productos } from "./Productos";
import { Reclamos } from "./Reclamos";
import { Resumen } from "./Resumen";
import { Stock } from "./Stock";
import { Usuarios } from "./Usuarios";
import { URL_TIENDA } from "@appweb/api/urls";

const ETIQUETAS: Record<string, string> = {
  resumen: "Resumen",
  pedidos: "Pedidos",
  reclamos: "Reclamos",
  envios: "Envíos",
  stock: "Stock",
  productos: "Productos",
  usuarios: "Usuarios",
  ajustes: "Ajustes",
};

const ICONOS: Record<string, ReactNode> = {
  resumen: <IconoMoneda />,
  pedidos: <IconoPedidos />,
  reclamos: <IconoLibro />,
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
    window.location.href = `${URL_TIENDA}/ingresar`;
  }

  // En escritorio no hay pantalla de menu: sin seccion se ve la primera.
  const visible = activa || (secciones[0] ?? "resumen");

  const avisos = useAvisos();
  /** El numero junto al nombre de la seccion: lo que espera a alguien. */
  const contadores: Record<string, number> = {
    pedidos: avisos.porConfirmar,
    envios: avisos.porDespachar,
    reclamos: avisos.reclamosPendientes,
  };
  function etiqueta(id: string): string {
    const texto = ETIQUETAS[id] ?? id;
    const n = contadores[id] ?? 0;
    return n > 0 ? `${texto} (${n})` : texto;
  }

  return (
    <DisposicionPanel
      secciones={secciones.map((id) => ({ id, etiqueta: etiqueta(id), icono: ICONOS[id] }))}
      seccionActiva={activa}
      onSeccion={ir}
      nombreUsuario={nombre}
      rolUsuario={rol}
      onSalir={salir}
      hrefTienda={URL_TIENDA}
    >
      {avisos.nuevo && secciones.includes("pedidos") ? (
        <Alerta tono="exito">
          Llegó el pedido <strong>{avisos.nuevo}</strong>.{" "}
          <Boton
            variante="secundario"
            onClick={() => {
              avisos.descartar();
              ir("pedidos");
            }}
          >
            Ver pedidos
          </Boton>{" "}
          <Boton variante="secundario" onClick={avisos.descartar}>
            Cerrar
          </Boton>
        </Alerta>
      ) : null}
      {visible === "resumen" ? (
        <Resumen />
      ) : visible === "pedidos" ? (
        <Pedidos puedeGestionar={puede(rol, "cambiar_estado_pedido")} />
      ) : visible === "reclamos" ? (
        <Reclamos />
      ) : visible === "envios" ? (
        <Envios puedeTarifas={puede(rol, "gestionar_ajustes")} />
      ) : visible === "productos" ? (
        <Productos />
      ) : visible === "stock" ? (
        <Stock />
      ) : visible === "usuarios" ? (
        <Usuarios usuarioIdActual={usuarioId} />
      ) : visible === "ajustes" ? (
        <Ajustes />
      ) : (
        <EstadoVacio
          titulo={ETIQUETAS[visible] ?? visible}
          texto="Esta sección todavía no está construida."
        />
      )}
    </DisposicionPanel>
  );
}
