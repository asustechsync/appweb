import Image from "next/image";
import Link from "next/link";

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
  orientacion?: "vertical" | "horizontal";
  tituloComo?: "h2";
  /**
   * Donde se pinta la tarjeta. No cambia nada visual: decide que ancho de
   * imagen pide el navegador, y los dos contextos difieren mucho.
   */
  contexto?: "rejilla" | "carrusel";
}

/**
 * Ancho real de la tarjeta en cada contexto, para que el navegador no baje
 * una imagen mas grande de la que se ve.
 *
 * En el carrusel la tarjeta mide ~182px en escritorio; pedir ahi el ancho de
 * la rejilla trae 640px (44 KB) donde bastan 256px (7 KB).
 */
const ANCHOS: Record<"rejilla" | "carrusel", string> = {
  // 2 columnas en movil, 3 desde 40rem y 4 desde 64rem, donde el contenedor
  // topa en 1400px y cada tarjeta no pasa de ~330px.
  rejilla: "(min-width: 64rem) 350px, (min-width: 40rem) 33vw, 50vw",
  // De 3 tarjetas visibles en movil a 7 en escritorio (ver --visibles).
  carrusel: "(min-width: 64rem) 190px, (min-width: 40rem) 20vw, 30vw",
};

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
  orientacion = "vertical",
  tituloComo,
  contexto = "rejilla",
}: PropsTarjetaProducto) {
  return (
    <Link className={`ui-tarjeta-producto ui-tarjeta-producto--${orientacion}`} href={`/productos/${slug}`}>
      <span className="ui-tarjeta-producto__imagen">
        {/* Sin imagen queda el fondo del recuadro: `next/image` con src vacio
            lanza en tiempo de ejecucion, y un producto sin foto no puede
            tumbar el listado entero. */}
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={nombre}
            width={400}
            height={400}
            sizes={ANCHOS[contexto]}
            loading="lazy"
          />
        ) : null}
        {descuentoPct ? (
          <span className="ui-tarjeta-producto__insignia">-{descuentoPct}%</span>
        ) : null}
        {etiqueta ? <span className="ui-tarjeta-producto__etiqueta">{etiqueta}</span> : null}
      </span>

      <span className="ui-tarjeta-producto__contenido">
        {marca ? <span className="ui-tarjeta-producto__marca">{marca}</span> : null}
        {tituloComo === "h2" ? <h2 className="ui-tarjeta-producto__nombre">{nombre}</h2> : <span className="ui-tarjeta-producto__nombre">{nombre}</span>}
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
        <Precio valor={precio} antes={precioLista ?? null} tamano="md" />
        {orientacion === "horizontal" ? <span className="ui-tarjeta-producto__flecha" aria-hidden="true">→</span> : null}
      </span>
    </Link>
  );
}
