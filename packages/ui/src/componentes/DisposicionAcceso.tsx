import Link from "next/link";
import type { ReactNode } from "react";

import { IconoFlechaIzquierda } from "../iconos";
import { Logo } from "./Logo";

import "./primitivos.css";

const CAMINO_CONTRARIO = {
  ingresar: { pregunta: "¿Nuevo aquí?", etiqueta: "Crear cuenta", href: "/registro" },
  registro: { pregunta: "¿Ya tienes cuenta?", etiqueta: "Conectar", href: "/ingresar" },
} as const;

export interface PropsDisposicionAcceso {
  /** Cual de las dos pantallas (ingresar / crear cuenta) es esta; decide el
      enlace al camino contrario que va al final. Sin valor no hay enlace y
      manda `pie` (recuperar contraseña). */
  activa?: keyof typeof CAMINO_CONTRARIO;
  titulo: string;
  children: ReactNode;
  /** Otras formas de entrar (Google, Apple...). Van tras un separador "o". */
  alternativas?: ReactNode;
  /** Linea final propia; solo se usa cuando no hay `activa`. */
  pie?: ReactNode;
}

/**
 * Pantalla de ingresar/crear cuenta: una columna centrada con logo, titulo,
 * formulario, otras opciones y el enlace al camino contrario.
 */
export function DisposicionAcceso({ activa, titulo, children, alternativas, pie }: PropsDisposicionAcceso) {
  const contrario = activa ? CAMINO_CONTRARIO[activa] : null;
  return (
    <main className="ui-acceso">
      <div className="ui-acceso__columna">
        <Link href="/" className="ui-acceso__volver">
          <IconoFlechaIzquierda tamano={16} />
          Volver
        </Link>
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
        {contrario ? (
          <p className="ui-acceso__pie">
            {contrario.pregunta} <Link href={contrario.href}>{contrario.etiqueta}</Link>
          </p>
        ) : pie ? (
          <p className="ui-acceso__pie">{pie}</p>
        ) : null}
      </div>
    </main>
  );
}
