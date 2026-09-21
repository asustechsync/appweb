"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { IconoCarrito, IconoPedidos, IconoUsuario } from "../iconos";

import "./primitivos.css";

export interface PropsAccionesCuenta {
  hrefUsuario?: string;
  hrefPedidos?: string;
  hrefCarrito?: string;
}

interface SesionVisible {
  nombre: string;
}

/**
 * Accesos de cuenta, pedidos y carrito en la cabecera.
 *
 * Isla cliente: es la unica pieza de la cabecera que sabe si hay alguien
 * sesionado. El layout raiz no puede leerlo (leer una cookie ahi volveria
 * dinamica toda la tienda), asi que esta isla pregunta por su cuenta a
 * `/api/sesion` al montar. Antes de esa respuesta se ve como si nadie hubiera
 * entrado — el mismo HTML que sirve el shell estatico, sin saltos.
 */
export function AccionesCuenta({
  hrefUsuario = "/ingresar",
  hrefPedidos = "/mi-cuenta/pedidos",
  hrefCarrito = "/carrito",
}: PropsAccionesCuenta) {
  const [sesion, setSesion] = useState<SesionVisible | null>(null);

  useEffect(() => {
    let vigente = true;
    fetch("/api/sesion")
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos: { sesion: SesionVisible | null } | null) => {
        if (vigente) setSesion(datos?.sesion ?? null);
      })
      .catch(() => {
        /* sin sesion visible: se queda como si nadie hubiera entrado */
      });
    return () => {
      vigente = false;
    };
  }, []);

  async function salir() {
    await fetch("/api/sesion", { method: "DELETE" });
    setSesion(null);
    window.location.href = "/";
  }

  return (
    <div className="ui-acciones-cuenta">
      {sesion ? (
        <button type="button" className="ui-acciones-cuenta__salir" onClick={salir}>
          Salir
        </button>
      ) : null}
      <Link
        href={sesion ? "/mi-cuenta" : hrefUsuario}
        aria-label="Mi cuenta"
        title={sesion ? `Hola, ${sesion.nombre}` : "Mi cuenta"}
      >
        <IconoUsuario />
      </Link>
      <Link href={hrefPedidos} aria-label="Mis pedidos" title="Mis pedidos">
        <IconoPedidos />
      </Link>
      <Link href={hrefCarrito} aria-label="Carrito" title="Carrito">
        <IconoCarrito />
      </Link>
    </div>
  );
}
