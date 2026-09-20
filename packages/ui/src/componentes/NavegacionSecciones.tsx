import Link from "next/link";

import "./primitivos.css";

export interface SeccionDeNavegacion {
  etiqueta: string;
  href: string;
}

export interface PropsNavegacionSecciones {
  secciones: SeccionDeNavegacion[];
}

/**
 * Lista de enlaces de la barra de secciones, debajo de la cabecera.
 *
 * Componente de servidor, sin JS propio: recibe los enlaces ya resueltos
 * (categorias reales desde la base + anclas de la portada) y solo los pinta,
 * para no decidir aqui que rutas existen.
 */
export function NavegacionSecciones({ secciones }: PropsNavegacionSecciones) {
  if (secciones.length === 0) return null;

  return (
    <nav className="ui-navegacion-secciones" aria-label="Secciones">
      <ul>
        {secciones.map((seccion) => (
          <li key={seccion.href}>
            <Link href={seccion.href}>{seccion.etiqueta}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
