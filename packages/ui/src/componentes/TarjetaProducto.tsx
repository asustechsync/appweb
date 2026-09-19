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
  /** Insignia libre sobre la imagen: "Nuevo", "Más vendido". */
  etiqueta?: string | null;
  marca?: string | null;
  /** Ya calculado por `resolverDisponibilidad` de @appweb/core. */
  disponible: boolean;
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
  marca,
  disponible,
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

      {marca ? <span className="ui-tarjeta-producto__marca">{marca}</span> : null}
      <span className="ui-tarjeta-producto__nombre">{nombre}</span>

      <span
        className={
          disponible
            ? "ui-tarjeta-producto__estado ui-tarjeta-producto__estado--disponible"
            : "ui-tarjeta-producto__estado ui-tarjeta-producto__estado--agotado"
        }
      >
        {disponible ? "Disponible" : "Agotado"}
      </span>

      {/* `?? null`: precioLista opcional puede llegar como `undefined`, y
          exactOptionalPropertyTypes distingue "prop omitida" de "prop en
          undefined". Precio si acepta null. */}
      <Precio valor={precio} antes={precioLista ?? null} />
    </a>
  );
}
