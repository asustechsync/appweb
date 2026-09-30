import type { ReactNode } from "react";

import { Header } from "./Header";

import "./primitivos.css";

export interface PropsPaginaTienda {
  children: ReactNode;
}

/**
 * Marco de la tienda y de la compra: cabecera y fondo plomo a todo el ancho,
 * el mismo de ingresar y crear cuenta.
 */
export function PaginaTienda({ children }: PropsPaginaTienda) {
  return (
    <div className="ui-pagina-tienda">
      <Header />
      {children}
    </div>
  );
}
