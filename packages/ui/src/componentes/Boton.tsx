"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import "./primitivos.css";

export interface PropsBoton {
  children: ReactNode;
  tipo?: "button" | "submit";
  variante?: "primario" | "secundario";
  disabled?: boolean;
  onClick?: () => void;
  anchoCompleto?: boolean;
  /** Con destino, se pinta como enlace con el mismo aspecto de boton. */
  href?: string;
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
}: PropsBoton) {
  const clases = [
    "ui-boton",
    `ui-boton--${variante}`,
    anchoCompleto ? "ui-boton--ancho-completo" : null,
  ]
    .filter(Boolean)
    .join(" ");

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
