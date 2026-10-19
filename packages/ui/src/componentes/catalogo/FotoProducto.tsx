import Image from "next/image";

import { IconoGaleria } from "../../iconos";

import "../estilos.css";

export interface PropsFotoProducto {
  /** Vacia o ausente: el producto todavia no tiene foto y se pinta el aviso. */
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  /** `false` en miniaturas: solo el icono, sin la leyenda. */
  leyenda?: boolean;
}

/**
 * La foto de un producto, o un aviso de "Sin imagen" mientras no hay una.
 *
 * Unico sitio que decide como se ve un producto sin foto: la tarjeta, la
 * ficha, el carrito y el pedido lo usan, asi que subir la primera foto desde
 * el panel cambia todos a la vez y ninguno tiene que defenderse del `src`
 * vacio (que en `next/image` lanza en tiempo de ejecucion).
 */
export function FotoProducto({
  src,
  alt,
  width,
  height,
  sizes,
  loading,
  priority,
  fetchPriority,
  leyenda = true,
}: PropsFotoProducto) {
  if (!src) {
    return (
      <span className="ui-sin-imagen" role="img" aria-label="Sin imagen">
        <IconoGaleria tamano={leyenda ? 28 : 20} />
        {leyenda ? <span>Sin imagen</span> : null}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      {...(loading ? { loading } : {})}
      {...(priority ? { priority } : {})}
      {...(fetchPriority ? { fetchPriority } : {})}
    />
  );
}
