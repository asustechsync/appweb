import Link from "next/link";
import type { ReactNode } from "react";

import { AccionesCuenta } from "./AccionesCuenta";
import { Buscador } from "./Buscador";
import { Logo } from "../base/Logo";
import { IconoOpciones, IconoBuscar } from "../../iconos";
import "./header.css";

export interface CategoriaDeCabecera {
  slug: string;
  nombre: string;
}

export interface PropsHeader {
  /** Categorias de primer nivel; las lee el layout de una funcion cacheada. */
  categorias?: CategoriaDeCabecera[];
  /** Boton de carrito con contador; lo aporta la app como isla cliente. */
  carrito?: ReactNode;
  /**
   * Movil: el carrito ocupa el sitio del menu de categorias, junto al
   * buscador, y sigue a la vista al hacer scroll (detalle de producto).
   */
  carritoJuntoAlBuscador?: boolean;
}

/**
 * Cabecera. Escritorio: logo, categorias al centro y, a la derecha, la lupa
 * junto a tema, carrito y cuenta. Movil: logo y acciones arriba; buscador y
 * menu de categorias abajo.
 *
 * La lupa y el menu son <details>: abren sin JavaScript, asi la cabecera sigue
 * siendo HTML estatico (Clase A) en todas las paginas.
 */
export function Header({ categorias = [], carrito, carritoJuntoAlBuscador = false }: PropsHeader) {
  return (
    <header className={carritoJuntoAlBuscador ? "ui-header ui-header--carrito-abajo" : "ui-header"}>
      <div className="ui-header__interior">
        <div className="ui-header__marca">
          <Logo />
        </div>

        {categorias.length > 0 ? (
          <nav className="ui-header__categorias" aria-label="Categorías">
            {categorias.map((categoria) => (
              <Link
                key={categoria.slug}
                className="ui-header__categoria"
                href={`/categorias/${categoria.slug}`}
              >
                {categoria.nombre}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="ui-header__buscador">
          <Buscador id="busqueda-header-movil" textoBuscar="Buscar productos" />
        </div>

        {/* Escritorio lo oculta: alli el carrito sigue en las acciones. */}
        {carritoJuntoAlBuscador ? (
          <div className="ui-header__carrito-abajo">
            <AccionesCuenta {...(carrito ? { carrito } : {})} soloCarrito />
          </div>
        ) : null}

        <details className="ui-header__menu">
          <summary className="ui-boton-icono" aria-label="Menú de categorías" title="Categorías">
            <IconoOpciones />
          </summary>
          <nav className="ui-header__desplegable ui-header__menu-lista" aria-label="Categorías">
            {categorias.map((categoria) => (
              <Link
                key={categoria.slug}
                className="ui-header__menu-enlace"
                href={`/categorias/${categoria.slug}`}
              >
                {categoria.nombre}
              </Link>
            ))}
          </nav>
        </details>

        <div className="ui-header__acciones">
          <details className="ui-header__lupa">
            <summary className="ui-boton-icono" aria-label="Buscar" title="Buscar">
              <IconoBuscar tamano={20} />
            </summary>
            <div className="ui-header__desplegable ui-header__lupa-panel">
              <Buscador id="busqueda-header" textoBuscar="Buscar productos, marcas y más" />
            </div>
          </details>
          <AccionesCuenta {...(carrito ? { carrito } : {})} />
        </div>
      </div>
    </header>
  );
}
