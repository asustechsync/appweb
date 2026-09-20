"use client";

import Image from "next/image";
import Link from "next/link";

import { Precio } from "./Precio";
import { SelectorCantidad } from "./SelectorCantidad";

import "./primitivos.css";

export interface PropsLineaDeCarrito {
  nombre: string;
  href: string;
  imagenUrl: string;
  talla: string;
  color: string;
  precioUnitario: number;
  /** Precio tachado. `null` si no esta en oferta. */
  precioLista?: number | null;
  cantidad: number;
  /** Unidades disponibles ahora mismo. */
  stock: number;
  /** Total de la linea, ya calculado fuera. */
  total: number;
  onCantidad: (cantidad: number) => void;
  onQuitar: () => void;
}

/**
 * Una linea del carrito. No calcula el total ni compara con el stock: recibe
 * las cifras resueltas y avisa hacia arriba cuando el comprador toca algo.
 *
 * Si la cantidad guardada supera el stock actual lo dice aqui mismo, junto a
 * la linea, en vez de dejar que falle recien al pagar.
 */
export function LineaDeCarrito({
  nombre,
  href,
  imagenUrl,
  talla,
  color,
  precioUnitario,
  precioLista,
  cantidad,
  stock,
  total,
  onCantidad,
  onQuitar,
}: PropsLineaDeCarrito) {
  const sinStock = stock === 0;
  const excedeStock = !sinStock && cantidad > stock;

  return (
    <article className="ui-linea-carrito">
      <Link className="ui-linea-carrito__imagen" href={href} tabIndex={-1} aria-hidden="true">
        <Image
          src={imagenUrl}
          alt=""
          width={200}
          height={200}
          sizes="96px"
          loading="lazy"
        />
      </Link>

      <div className="ui-linea-carrito__datos">
        <Link className="ui-linea-carrito__nombre" href={href}>
          {nombre}
        </Link>
        <p className="ui-linea-carrito__variante">
          Talla {talla} · {color}
        </p>
        <Precio valor={precioUnitario} antes={precioLista ?? null} tamano="sm" />

        {sinStock ? (
          <p className="ui-linea-carrito__aviso ui-linea-carrito__aviso--error">
            Sin stock. Quítalo para continuar.
          </p>
        ) : excedeStock ? (
          <p className="ui-linea-carrito__aviso ui-linea-carrito__aviso--error">
            Solo quedan {stock} {stock === 1 ? "unidad" : "unidades"}.
          </p>
        ) : stock <= 5 ? (
          <p className="ui-linea-carrito__aviso">
            Últimas {stock} {stock === 1 ? "unidad" : "unidades"}.
          </p>
        ) : null}
      </div>

      <div className="ui-linea-carrito__acciones">
        <SelectorCantidad
          valor={cantidad}
          maximo={Math.max(stock, 1)}
          onCambio={onCantidad}
          etiqueta={`Cantidad de ${nombre}`}
        />
        <button type="button" className="ui-linea-carrito__quitar" onClick={onQuitar}>
          Quitar
        </button>
      </div>

      <div className="ui-linea-carrito__total">
        <Precio valor={total} tamano="md" />
      </div>
    </article>
  );
}
