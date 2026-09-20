import Link from "next/link";

import { Precio } from "./Precio";

import "./primitivos.css";

export interface PropsTarjetaMarca {
  slug: string;
  nombre: string;
  logo?: string | null;
}

/**
 * Tarjeta de marca: logo, nombre y enlace a la marca.
 *
 * Componente de servidor, sin JS. Reutilizable en carruseles de marcas.
 */
export function TarjetaMarca({ slug, nombre, logo }: PropsTarjetaMarca) {
  return (
    <Link className="ui-tarjeta-marca" href={`/marcas/${slug}`}>
      {logo ? (
        <div className="ui-tarjeta-marca__logo">
          <img src={logo} alt={nombre} />
        </div>
      ) : null}
      <span className="ui-tarjeta-marca__nombre">{nombre}</span>
    </Link>
  );
}
