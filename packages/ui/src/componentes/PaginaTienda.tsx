import type { ReactNode } from "react";

import { Header } from "./Header";

import "./primitivos.css";

export interface PropsPaginaTienda {
  children: ReactNode;
  /**
   * `solo-escritorio`: sin cabecera en movil, para pantallas que traen su
   * propia barra con flecha de volver (mi cuenta).
   */
  cabecera?: "siempre" | "solo-escritorio";
}

/**
 * Marco de la tienda y de la compra: cabecera y fondo plomo a todo el ancho,
 * el mismo de ingresar y crear cuenta.
 */
export function PaginaTienda({ children, cabecera = "siempre" }: PropsPaginaTienda) {
  return (
    <div
      className={
        cabecera === "solo-escritorio"
          ? "ui-pagina-tienda ui-pagina-tienda--sin-cabecera-movil"
          : "ui-pagina-tienda"
      }
    >
      <Header />
      {children}
    </div>
  );
}
