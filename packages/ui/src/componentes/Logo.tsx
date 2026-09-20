import Link from "next/link";

import "./primitivos.css";

export interface PropsLogo {
  /** Destino del logo. Por defecto la portada. */
  href?: string;
}

/**
 * Logo de texto de la marca.
 *
 * Componente de servidor, sin JS. Independiente de la cabecera: tambien se
 * usa en el pie de pagina y podria usarse en el panel admin.
 */
export function Logo({ href = "/" }: PropsLogo) {
  return (
    <Link className="ui-logo" href={href} aria-label="Ir a la portada">
      SOCKS
    </Link>
  );
}
