"use client";

import type { FormEvent, ReactNode } from "react";

import "./primitivos.css";

export interface PropsFormulario {
  onSubmit: (evento: FormEvent) => void;
  children: ReactNode;
  /** Linea al pie, fuera del flujo de campos: "¿No tienes cuenta? Crea una". */
  pie?: ReactNode;
  /** "angosto" (por defecto): columna de 28rem, para ingresar/registro/checkout.
      "completo": ocupa el ancho de su contenedor, para formularios con `FilaCampos`
      dentro de una tarjeta ancha como /mi-cuenta. */
  ancho?: "angosto" | "completo";
}

/** Columna de campos con el espaciado fijo de todos los formularios del sitio. */
export function Formulario({ onSubmit, children, pie, ancho = "angosto" }: PropsFormulario) {
  return (
    <form
      className={ancho === "completo" ? "ui-formulario ui-formulario--completo" : "ui-formulario"}
      onSubmit={onSubmit}
      noValidate
    >
      {children}
      {pie ? <p className="ui-formulario__pie">{pie}</p> : null}
    </form>
  );
}
