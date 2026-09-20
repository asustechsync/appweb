import Link from "next/link";

import { GaleriaProducto, type ImagenGaleria } from "./GaleriaProducto";
import { Precio } from "./Precio";
import { SelectorVariantes, type OpcionDeCompra } from "./SelectorVariantes";

import "./primitivos.css";

export interface PropsFichaProducto {
  nombre: string;
  marca?: string | null;
  descripcion?: string | null;
  descripcionCorta?: string | null;
  etiqueta?: string | null;
  imagenes: ImagenGaleria[];
  /** Ya resueltos por `resolverPrecio` de @appweb/core. */
  precio: number;
  precioLista?: number | null;
  descuentoPct?: number | null;
  /** Ya resuelta por `resolverDisponibilidad` de @appweb/core. */
  disponible: boolean;
  stockBajo?: boolean;
  stockTotal?: number;
  /** Ya resueltas por `opcionesDeCompra` de @appweb/core. */
  opciones: OpcionDeCompra[];
  categoria?: { slug: string; nombre: string } | null;
}

/**
 * Ficha completa de un producto: galeria a un lado, datos y compra al otro.
 *
 * Componente de servidor: solo la galeria y el selector se hidratan. Como
 * TarjetaProducto, no calcula nada — recibe precio, disponibilidad y opciones
 * ya resueltos por @appweb/core.
 */
export function FichaProducto({
  nombre,
  marca,
  descripcion,
  descripcionCorta,
  etiqueta,
  imagenes,
  precio,
  precioLista,
  descuentoPct,
  disponible,
  stockBajo,
  stockTotal,
  opciones,
  categoria,
}: PropsFichaProducto) {
  return (
    <article className="ui-ficha-producto">
      <div className="ui-ficha-producto__galeria">
        <GaleriaProducto
          imagenes={imagenes}
          descuentoPct={descuentoPct ?? null}
          etiqueta={etiqueta ?? null}
        />
      </div>

      <div className="ui-ficha-producto__panel">
        {categoria ? (
          <Link className="ui-ficha-producto__categoria" href={`/categorias/${categoria.slug}`}>
            {categoria.nombre}
          </Link>
        ) : null}

        {marca ? <span className="ui-ficha-producto__marca">{marca}</span> : null}
        <h1 className="ui-ficha-producto__nombre">{nombre}</h1>

        {descripcionCorta ? (
          <p className="ui-ficha-producto__resumen">{descripcionCorta}</p>
        ) : null}

        <div className="ui-ficha-producto__precio">
          <Precio valor={precio} antes={precioLista ?? null} tamano="lg" />
        </div>

        <div className="ui-ficha-producto__estado">
          <span
            className={
              disponible
                ? "ui-ficha-producto__disponibilidad ui-ficha-producto__disponibilidad--disponible"
                : "ui-ficha-producto__disponibilidad ui-ficha-producto__disponibilidad--agotado"
            }
          >
            {disponible ? "Disponible" : "Agotado"}
          </span>
          {disponible && stockBajo && stockTotal !== undefined ? (
            <span className="ui-ficha-producto__stock-bajo">Ultimas {stockTotal} unidades</span>
          ) : null}
        </div>

        {disponible ? <SelectorVariantes opciones={opciones} /> : null}

        {descripcion ? (
          <section className="ui-ficha-producto__descripcion">
            <h2 className="ui-ficha-producto__subtitulo">Descripcion</h2>
            <p>{descripcion}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}
