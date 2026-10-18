"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import "../estilos.css";

export interface PropsBoton {
  children: ReactNode;
  tipo?: "button" | "submit";
  variante?: "primario" | "secundario";
  disabled?: boolean;
  onClick?: () => void;
  anchoCompleto?: boolean;
  /** Con destino, se pinta como enlace con el mismo aspecto de boton. */
  href?: string;
  /** `href` a otro sitio (WhatsApp, un mapa): abre en una pestaña nueva. */
  externo?: boolean;
}

/** Boton de accion. Primario para el paso que avanza, secundario para todo lo demas. */
export function Boton({
  children,
  tipo = "button",
  variante = "primario",
  disabled,
  onClick,
  anchoCompleto,
  href,
  externo = false,
}: PropsBoton) {
  const clases = [
    "ui-boton",
    `ui-boton--${variante}`,
    anchoCompleto ? "ui-boton--ancho-completo" : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (href && !disabled && externo) {
    return (
      <a href={href} className={clases} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  if (href && !disabled) {
    return (
      <Link href={href} className={clases}>
        {children}
      </Link>
    );
  }

  return (
    <button type={tipo} onClick={onClick} disabled={disabled} className={clases}>
      {children}
    </button>
  );
}
