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
      <svg className="ui-logo__simbolo" viewBox="0 0 32 24" aria-hidden="true">
        <path d="M3 21 14 3h4l11 18h-5L16 8 8 21H3Z" />
      </svg>
      <span>SOCKS</span>
    </Link>
  );
}
