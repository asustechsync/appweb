import type { ReactNode } from "react";

import { Header, type CategoriaDeCabecera } from "./Header";

import "./primitivos.css";

export interface PropsPaginaTienda {
  children: ReactNode;
  /**
   * `solo-escritorio`: sin cabecera en movil, para pantallas que traen su
   * propia barra con flecha de volver (mi cuenta).
   */
  cabecera?: "siempre" | "solo-escritorio";
  /** Categorias de la cabecera; el layout las lee de una funcion cacheada. */
  categorias?: CategoriaDeCabecera[];
}

/**
 * Marco de la tienda y de la compra: cabecera y fondo de escena (cielo que se
 * funde con el plomo) a todo el ancho, el mismo de ingresar y crear cuenta.
 */
export function PaginaTienda({ children, cabecera = "siempre", categorias }: PropsPaginaTienda) {
  return (
    <div
      className={
        cabecera === "solo-escritorio"
          ? "ui-pagina-tienda ui-fondo-escena ui-pagina-tienda--sin-cabecera-movil"
          : "ui-pagina-tienda ui-fondo-escena"
      }
    >
      <Header {...(categorias ? { categorias } : {})} />
      {children}
    </div>
  );
}
