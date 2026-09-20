import Image from "next/image";
import Link from "next/link";

import "./primitivos.css";

export interface PropsBannerPromo {
  titulo: string;
  texto?: string;
  imagenUrl?: string;
  /** Si falta, se pinta como bloque simple en vez de enlace. */
  href?: string;
}

/**
 * Banner promocional con imagen de fondo: pensado para el panel lateral de
 * Hero, dos apilados junto a la vitrina. Solo informativo — no calcula
 * ofertas ni descuentos, pinta lo que recibe.
 *
 * Componente de servidor, sin JS propio. Se reparte la altura de su
 * contenedor via `.ui-hero__panel > *`, igual que TarjetaProducto dentro
 * de Carrusel.
 */
export function BannerPromo({ titulo, texto, imagenUrl, href }: PropsBannerPromo) {
  const contenido = (
    <>
      {imagenUrl ? (
        <span className="ui-banner-promo__imagen">
          <Image
            src={imagenUrl}
            alt=""
            width={600}
            height={400}
            sizes="(min-width: 64rem) 30vw, 100vw"
            loading="lazy"
          />
        </span>
      ) : null}
      <span className="ui-banner-promo__texto">
        <span className="ui-banner-promo__titulo">{titulo}</span>
        {texto ? <span className="ui-banner-promo__subtexto">{texto}</span> : null}
      </span>
    </>
  );

  if (href) {
    return (
      <Link className="ui-banner-promo" href={href}>
        {contenido}
      </Link>
    );
  }

  return <div className="ui-banner-promo">{contenido}</div>;
}
