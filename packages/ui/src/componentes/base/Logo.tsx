import Link from "next/link";

import { NOMBRE_MARCA, SIMBOLO_LOGO } from "../../marca";

import "../estilos.css";

export interface PropsLogo {
  /** Destino del logo. Por defecto la portada. */
  href?: string;
}

/**
 * Logo de la marca con el simbolo vectorizado de la imagen original.
 *
 * Componente de servidor, sin JS. Independiente de la cabecera: tambien se
 * usa en el pie de pagina y podria usarse en el panel admin.
 */
export function Logo({ href = "/" }: PropsLogo) {
  return (
    <Link className="ui-logo" href={href} aria-label="Ir a la portada">
      <svg className="ui-logo__simbolo" viewBox={SIMBOLO_LOGO.viewBox} aria-hidden="true">
        <path fillRule="evenodd" d={SIMBOLO_LOGO.trazo} />
      </svg>
      <span>{NOMBRE_MARCA}</span>
    </Link>
  );
}
