import Link from "next/link";

import "./primitivos.css";

export interface PropsBannerOferta {
  titulo: string;
  texto?: string;
  /** Si falta, se pinta como bloque simple en vez de enlace. */
  href?: string;
}

/**
 * Banner promocional para el primer lugar del carrusel de ofertas.
 *
 * No define su propio ancho ni alto: el carrusel dimensiona a cualquier
 * hijo directo via `.ui-carrusel-productos__pista > *`, igual que a
 * TarjetaProducto, asi que ocupa el mismo espacio sin necesitar coincidir
 * con esa tarjeta a mano.
 */
export function BannerOferta({ titulo, texto, href }: PropsBannerOferta) {
  const contenido = (
    <>
      <span className="ui-banner-oferta__titulo">{titulo}</span>
      {texto ? <span className="ui-banner-oferta__texto">{texto}</span> : null}
    </>
  );

  if (href) {
    return (
      <Link className="ui-banner-oferta" href={href}>
        {contenido}
      </Link>
    );
  }

  return <div className="ui-banner-oferta">{contenido}</div>;
}
