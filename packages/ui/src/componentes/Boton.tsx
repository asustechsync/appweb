"use client";

import type { ReactNode } from "react";

import "./primitivos.css";

export interface PropsBoton {
  children: ReactNode;
  tipo?: "button" | "submit";
  variante?: "primario" | "secundario";
  disabled?: boolean;
  onClick?: () => void;
  anchoCompleto?: boolean;
}

/** Boton de accion. Primario para el paso que avanza, secundario para todo lo demas. */
export function Boton({
  children,
  tipo = "button",
  variante = "primario",
  disabled,
  onClick,
  anchoCompleto,
}: PropsBoton) {
  const clases = [
    "ui-boton",
    `ui-boton--${variante}`,
    anchoCompleto ? "ui-boton--ancho-completo" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={tipo} onClick={onClick} disabled={disabled} className={clases}>
      {children}
    </button>
  );
}
