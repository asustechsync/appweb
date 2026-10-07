import Link from "next/link";

import { AccionesCuenta } from "./AccionesCuenta";
import { Buscador } from "./Buscador";
import { Logo } from "./Logo";
import { IconoOpciones, IconoSearch } from "../iconos";
import "./estilos/header.css";

export interface CategoriaDeCabecera {
  slug: string;
  nombre: string;
}

export interface PropsHeader {
  /** Categorias de primer nivel; las lee el layout de una funcion cacheada. */
  categorias?: CategoriaDeCabecera[];
}

/**
 * Cabecera. Escritorio: logo, categorias al centro y, a la derecha, la lupa
 * junto a tema, carrito y cuenta. Movil: logo y acciones arriba; buscador y
 * menu de categorias abajo.
 *
 * La lupa y el menu son <details>: abren sin JavaScript, asi la cabecera sigue
 * siendo HTML estatico (Clase A) en todas las paginas.
 */
export function Header({ categorias = [] }: PropsHeader) {
  return (
    <header className="ui-header">
      <div className="ui-header__interior">
        <div className="ui-header__marca">
          <Logo />
        </div>

        {categorias.length > 0 ? (
          <nav className="ui-header__categorias" aria-label="Categorías">
            {categorias.map((categoria) => (
              <Link key={categoria.slug} className="ui-header__categoria" href={`/categorias/${categoria.slug}`}>
                {categoria.nombre}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="ui-header__buscador">
          <Buscador id="busqueda-header-movil" textoBuscar="Buscar productos" />
        </div>

        <details className="ui-header__menu">
          <summary className="ui-header__boton" aria-label="Menú de categorías" title="Categorías">
            <IconoOpciones />
          </summary>
          <nav className="ui-header__desplegable ui-header__menu-lista" aria-label="Categorías">
            {categorias.map((categoria) => (
              <Link key={categoria.slug} className="ui-header__menu-enlace" href={`/categorias/${categoria.slug}`}>
                {categoria.nombre}
              </Link>
            ))}
          </nav>
        </details>

        <div className="ui-header__acciones">
          <details className="ui-header__lupa">
            <summary className="ui-header__boton" aria-label="Buscar" title="Buscar">
              <IconoSearch tamano={20} />
            </summary>
            <div className="ui-header__desplegable ui-header__lupa-panel">
              <Buscador id="busqueda-header" textoBuscar="Buscar productos, marcas y más" />
            </div>
          </details>
          <AccionesCuenta />
        </div>
      </div>
    </header>
  );
}
