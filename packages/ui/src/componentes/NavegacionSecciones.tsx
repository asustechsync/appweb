import Link from "next/link";
import type { ReactNode } from "react";

import { ItemDesplegable, type EnlaceDeDesplegable } from "./ItemDesplegable";

import "./primitivos.css";

// `icono` es un nodo ya renderizado (`<IconoTal tamano={14} />`), no el
// componente en si: NavegacionSecciones es de servidor pero ItemDesplegable
// es cliente, y RSC no deja pasar una referencia a funcion de un lado al
// otro del limite — solo un arbol ya resuelto.
export type SeccionDeNavegacion =
  | { tipo: "enlace"; etiqueta: string; href: string; icono?: ReactNode }
  | { tipo: "desplegable"; etiqueta: string; items: EnlaceDeDesplegable[]; icono?: ReactNode }
  /** Sin destino todavia: se pinta pero no navega, para no apuntar a un 404. */
  | { tipo: "visual"; etiqueta: string; icono?: ReactNode };

export interface PropsNavegacionSecciones {
  secciones: SeccionDeNavegacion[];
}

/**
 * Lista de la barra de secciones, debajo de la cabecera.
 *
 * Casi todo es HTML estatico: solo los items "desplegable" son isla cliente
 * (ItemDesplegable), montada aparte sin bloquear el resto.
 */
export function NavegacionSecciones({ secciones }: PropsNavegacionSecciones) {
  if (secciones.length === 0) return null;

  return (
    <nav className="ui-navegacion-secciones" aria-label="Secciones">
      <ul>
        {secciones.map((seccion) => (
          <li key={seccion.etiqueta}>
            {seccion.tipo === "enlace" ? (
              <Link href={seccion.href}>
                {seccion.icono}
                {seccion.etiqueta}
              </Link>
            ) : seccion.tipo === "desplegable" ? (
              <ItemDesplegable
                etiqueta={seccion.etiqueta}
                items={seccion.items}
                icono={seccion.icono}
              />
            ) : (
              <span className="ui-navegacion-secciones__proximamente">
                {seccion.icono}
                {seccion.etiqueta}
                <em>Pronto</em>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
