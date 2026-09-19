import { Precio } from "./Precio";

import "./primitivos.css";

export interface PropsTarjetaProducto {
  slug: string;
  nombre: string;
  imagenUrl: string;
  precio: number;
  /** Precio tachado. `null`/omitido si no hay oferta. */
  precioLista?: number | null;
  /** Ya calculado por `resolverPrecio` de @appweb/core; esta tarjeta no calcula nada. */
  descuentoPct?: number | null;
  /** Insignia libre: "Nuevo", "Más vendido". */
  etiqueta?: string | null;
}

/**
 * Tarjeta de producto para cualquier listado: rejilla de categoria, ofertas,
 * destacados. No sabe de donde vienen los datos ni si es una oferta "de
 * verdad" — solo pinta lo que recibe.
 */
export function TarjetaProducto({
  slug,
  nombre,
  imagenUrl,
  precio,
  precioLista,
  descuentoPct,
  etiqueta,
}: PropsTarjetaProducto) {
  return (
    <a className="ui-tarjeta-producto" href={`/productos/${slug}`}>
      <span className="ui-tarjeta-producto__imagen">
        <img src={imagenUrl} alt={nombre} width={400} height={400} loading="lazy" decoding="async" />
        {descuentoPct ? (
          <span className="ui-tarjeta-producto__insignia">-{descuentoPct}%</span>
        ) : null}
        {etiqueta ? <span className="ui-tarjeta-producto__etiqueta">{etiqueta}</span> : null}
      </span>
      <span className="ui-tarjeta-producto__nombre">{nombre}</span>
      {/* `?? null`: precioLista opcional puede llegar como `undefined`, y
          exactOptionalPropertyTypes distingue "prop omitida" de "prop en
          undefined". Precio si acepta null. */}
      <Precio valor={precio} antes={precioLista ?? null} />
    </a>
  );
}
