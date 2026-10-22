"use client";

import { useEffect, useState, type ReactNode } from "react";

import { apartadoDeSeccion, grupoDeSeccion, puede, type Rol } from "@appweb/core";
import {
  Alerta,
  Boton,
  DisposicionPanel,
  EstadoVacio,
  IconoCamion,
  IconoCarrito,
  IconoCatalogo,
  IconoCategoria,
  IconoClientes,
  IconoConfiguracion,
  IconoDevolucion,
  IconoEscudo,
  IconoEstrella,
  IconoEtiqueta,
  IconoGaleria,
  IconoInicio,
  IconoLibro,
  IconoMarca,
  IconoMoneda,
  IconoOpiniones,
  IconoPack,
  IconoPedidos,
  IconoPremio,
  IconoProveedor,
  IconoPromociones,
  IconoTicket,
  IconoVentas,
  Logo,
} from "@appweb/ui";

import { useAvisos } from "@/lib/use-avisos";

import { Categorias, Marcas } from "./Categorias";
import { Devoluciones } from "./Devoluciones";
import { Envios } from "./Envios";
import { Inventario } from "./Inventario";
import { Niveles } from "./Niveles";
import { Portada, Promociones } from "./Promociones";
import { Packs } from "./Packs";
import { Pagos } from "./Pagos";
import { Pedidos } from "./Pedidos";
import { Productos } from "./Productos";
import { Proveedores } from "./Proveedores";
import { Reclamos } from "./Reclamos";
import { Resenas } from "./Resenas";
import { Resumen } from "./Resumen";
import { Usuarios } from "./Usuarios";
import { URL_TIENDA } from "@appweb/api/urls";

// El orden y el grupo de cada seccion los decide `seccionesDelPanel` de
// @appweb/core; aqui solo se le pone nombre e icono.
const ETIQUETAS: Record<string, string> = {
  inicio: "Inicio",
  pedidos: "Pedidos",
  pagos: "Pagos",
  envios: "Envíos",
  devoluciones: "Devoluciones",
  productos: "Productos",
  inventario: "Inventario",
  categorias: "Categorías",
  marcas: "Marcas",
  proveedores: "Proveedores",
  packs: "Packs y combos",
  clientes: "Clientes",
  resenas: "Reseñas",
  reclamos: "Reclamos",
  cupones: "Cupones",
  portada: "Portada",
  equipo: "Equipo y roles",
  niveles: "Niveles",
  tienda: "Datos de la tienda",
};

const ICONOS: Record<string, ReactNode> = {
  inicio: <IconoInicio />,
  pedidos: <IconoPedidos />,
  pagos: <IconoMoneda />,
  envios: <IconoCamion />,
  devoluciones: <IconoDevolucion />,
  productos: <IconoCarrito />,
  inventario: <IconoEtiqueta />,
  categorias: <IconoCategoria />,
  marcas: <IconoMarca />,
  proveedores: <IconoProveedor />,
  packs: <IconoPack />,
  clientes: <IconoClientes />,
  resenas: <IconoEstrella />,
  reclamos: <IconoLibro />,
  cupones: <IconoTicket tamano={20} />,
  portada: <IconoGaleria tamano={20} />,
  equipo: <IconoEscudo />,
  niveles: <IconoPremio />,
};

/** En el lateral el icono va en el titulo del grupo, no en cada seccion. */
const ICONOS_GRUPO: Record<string, ReactNode> = {
  Ventas: <IconoVentas />,
  Catálogo: <IconoCatalogo />,
  Cuentas: <IconoClientes />,
  Opiniones: <IconoOpiniones />,
  Promociones: <IconoPromociones />,
  Configuración: <IconoConfiguracion />,
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
  const visible = activa || (secciones[0] ?? "inicio");

  const avisos = useAvisos();
  /** La insignia junto al nombre de la seccion: lo que espera a alguien. */
  const contadores: Record<string, number> = {
    pedidos: avisos.porConfirmar,
    pagos: avisos.porConfirmar,
    envios: avisos.porDespachar,
    reclamos: avisos.reclamosPendientes,
    resenas: avisos.resenasPendientes,
  };

  return (
    <DisposicionPanel
      secciones={secciones.map((id) => ({
        id,
        etiqueta: ETIQUETAS[id] ?? id,
        icono: ICONOS[id],
        grupo: grupoDeSeccion(id),
        apartado: apartadoDeSeccion(id),
        contador: contadores[id],
      }))}
      iconosGrupo={ICONOS_GRUPO}
      seccionActiva={activa}
      onSeccion={ir}
      marcaLateral={<Logo href={URL_TIENDA} />}
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
      {visible === "inicio" ? (
        <Resumen />
      ) : visible === "pedidos" ? (
        <Pedidos puedeGestionar={puede(rol, "cambiar_estado_pedido")} />
      ) : visible === "pagos" ? (
        <Pagos puedeGestionar={puede(rol, "cambiar_estado_pedido")} />
      ) : visible === "devoluciones" ? (
        <Devoluciones puedeGestionar={puede(rol, "cambiar_estado_pedido")} />
      ) : visible === "reclamos" ? (
        <Reclamos />
      ) : visible === "resenas" ? (
        <Resenas />
      ) : visible === "envios" ? (
        <Envios puedeTarifas={puede(rol, "gestionar_ajustes")} />
      ) : visible === "productos" ? (
        <Productos />
      ) : visible === "inventario" ? (
        <Inventario />
      ) : visible === "categorias" ? (
        <Categorias />
      ) : visible === "marcas" ? (
        <Marcas />
      ) : visible === "proveedores" ? (
        <Proveedores />
      ) : visible === "packs" ? (
        <Packs />
      ) : visible === "clientes" ? (
        <Usuarios key="clientes" usuarioIdActual={usuarioId} alcance="clientes" />
      ) : visible === "equipo" ? (
        <Usuarios key="equipo" usuarioIdActual={usuarioId} alcance="equipo" />
      ) : visible === "niveles" ? (
        <Niveles />
      ) : visible === "cupones" ? (
        <Promociones />
      ) : visible === "portada" ? (
        <Portada />
      ) : (
        <EstadoVacio
          titulo={ETIQUETAS[visible] ?? visible}
          texto="Esta sección todavía no está construida."
        />
      )}
    </DisposicionPanel>
  );
}
