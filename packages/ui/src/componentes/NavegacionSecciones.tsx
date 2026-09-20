import Link from "next/link";

import { ItemDesplegable, type EnlaceDeDesplegable } from "./ItemDesplegable";

import "./primitivos.css";

export type SeccionDeNavegacion =
  | { tipo: "enlace"; etiqueta: string; href: string }
  | { tipo: "desplegable"; etiqueta: string; items: EnlaceDeDesplegable[] }
  /** Sin destino todavia: se pinta pero no navega, para no apuntar a un 404. */
  | { tipo: "visual"; etiqueta: string };

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
              <Link href={seccion.href}>{seccion.etiqueta}</Link>
            ) : seccion.tipo === "desplegable" ? (
              <ItemDesplegable etiqueta={seccion.etiqueta} items={seccion.items} />
            ) : (
              <span className="ui-navegacion-secciones__proximamente">
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
