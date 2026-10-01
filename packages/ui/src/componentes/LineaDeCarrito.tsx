"use client";

import Image from "next/image";
import Link from "next/link";

import { IconoPapelera } from "../iconos";
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

  const aviso = sinStock
    ? "Sin stock. Quítalo para continuar."
    : excedeStock
      ? `Solo quedan ${stock} ${stock === 1 ? "unidad" : "unidades"}.`
      : stock <= 5
        ? `Últimas ${stock} ${stock === 1 ? "unidad" : "unidades"}.`
        : null;

  return (
    <article className="ui-linea-carrito">
      <div className="ui-linea-carrito__producto">
        <Link className="ui-linea-carrito__imagen" href={href} tabIndex={-1} aria-hidden="true">
          <Image
            src={imagenUrl}
            alt=""
            width={200}
            height={200}
            sizes="112px"
            loading="lazy"
          />
        </Link>

        <div className="ui-linea-carrito__datos">
          <Link className="ui-linea-carrito__nombre" href={href}>
            {nombre}
          </Link>
          <p className="ui-linea-carrito__variante">
            {color}
            <span aria-hidden="true" className="ui-linea-carrito__separador" />
            Talla {talla}
          </p>
          {aviso ? (
            <p
              className={
                sinStock || excedeStock
                  ? "ui-linea-carrito__aviso ui-linea-carrito__aviso--error"
                  : "ui-linea-carrito__aviso"
              }
            >
              {aviso}
            </p>
          ) : null}
        </div>
      </div>

      <div className="ui-linea-carrito__cantidad">
        <SelectorCantidad
          valor={cantidad}
          maximo={Math.max(stock, 1)}
          onCambio={onCantidad}
          etiqueta={`Cantidad de ${nombre}`}
        />
        <button
          type="button"
          className="ui-linea-carrito__quitar"
          onClick={onQuitar}
          aria-label={`Quitar ${nombre}`}
        >
          <IconoPapelera tamano={14} />
          Quitar
        </button>
      </div>

      <div className="ui-linea-carrito__precio">
        <Precio valor={total} tamano="md" />
        {cantidad > 1 ? (
          <span className="ui-linea-carrito__unitario">
            <Precio valor={precioUnitario} antes={precioLista ?? null} tamano="sm" /> c/u
          </span>
        ) : precioLista ? (
          <Precio valor={precioUnitario} antes={precioLista} tamano="sm" />
        ) : null}
      </div>
    </article>
  );
}
