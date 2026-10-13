"use client";

import type { MouseEvent } from "react";

import { IconoCarrito, IconoFlechaIzquierda } from "../iconos";
import { Contenedor } from "./Contenedor";

import "./primitivos.css";

export interface PropsBarraMovil {
  titulo: string;
  /** Destino de la flecha si no hay pagina anterior a la que volver. */
  hrefVolver?: string;
  /** Destino del boton de la derecha (el carrito). */
  hrefAccion?: string;
  /** Unidades en el carrito; con 0 no se muestra insignia. */
  cantidadAccion?: number;
}

/**
 * Barra superior de movil para pantallas sin cabecera: flecha de volver a la
 * izquierda, titulo al centro y carrito a la derecha. Ocupa todo el ancho, con
 * el fondo de la foto de producto. Desde `lg` no se ve.
 */
export function BarraMovil({
  titulo,
  hrefVolver = "/",
  hrefAccion = "/carrito",
  cantidadAccion = 0,
}: PropsBarraMovil) {
  function volver(evento: MouseEvent<HTMLAnchorElement>) {
    if (window.history.length > 1) {
      evento.preventDefault();
      window.history.back();
    }
  }

  return (
    <div className="ui-barra-movil">
      <Contenedor>
        <div className="ui-barra-movil__fila">
          <a href={hrefVolver} onClick={volver} className="ui-barra-movil__boton" aria-label="Volver">
            <IconoFlechaIzquierda />
          </a>
          <span className="ui-barra-movil__titulo">{titulo}</span>
          <a
            href={hrefAccion}
            className="ui-barra-movil__boton"
            aria-label={cantidadAccion > 0 ? `Ver carrito, ${cantidadAccion} unidades` : "Ver carrito"}
          >
            <IconoCarrito />
            {cantidadAccion > 0 ? (
              <span className="ui-barra-movil__contador" aria-hidden="true">
                {cantidadAccion > 99 ? "99+" : cantidadAccion}
              </span>
            ) : null}
          </a>
        </div>
      </Contenedor>
    </div>
  );
}
