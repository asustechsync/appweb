import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./Logo";

import "./primitivos.css";

const PESTANAS = [
  { clave: "ingresar", etiqueta: "Conectar", href: "/ingresar" },
  { clave: "registro", etiqueta: "Crear cuenta", href: "/registro" },
] as const;

export interface PropsDisposicionAcceso {
  /** Cual de las dos pestañas (ingresar / crear cuenta) es esta pantalla. */
  activa: (typeof PESTANAS)[number]["clave"];
  titulo: string;
  children: ReactNode;
  /** Otras formas de entrar (Google, Apple...). Van tras un separador "o". */
  alternativas?: ReactNode;
  /** Linea final: "¿Nuevo aquí? Crea una cuenta". */
  pie?: ReactNode;
}

/**
 * Pantalla de ingresar/crear cuenta: una columna centrada con pestañas, logo, titulo,
 * formulario, otras opciones y el enlace al camino contrario.
 */
export function DisposicionAcceso({ activa, titulo, children, alternativas, pie }: PropsDisposicionAcceso) {
  return (
    <main className="ui-acceso">
      <div className="ui-acceso__columna">
        <nav className="ui-acceso__pestanas" aria-label="Ingresar o crear cuenta">
          {PESTANAS.map(({ clave, etiqueta, href }) => (
            <Link
              key={clave}
              href={href}
              className="ui-acceso__pestana"
              aria-current={clave === activa ? "page" : undefined}
            >
              {etiqueta}
            </Link>
          ))}
        </nav>
        <div className="ui-acceso__logo">
          <Logo />
        </div>
        <h1 className="ui-acceso__titulo">{titulo}</h1>
        {children}
        {alternativas ? (
          <>
            <div className="ui-acceso__separador" role="separator">
              <span>o</span>
            </div>
            <div className="ui-acceso__alternativas">{alternativas}</div>
          </>
        ) : null}
        {pie ? <p className="ui-acceso__pie">{pie}</p> : null}
      </div>
    </main>
  );
}
