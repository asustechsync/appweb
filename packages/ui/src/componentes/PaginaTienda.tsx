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
  /** Boton de carrito con contador para la cabecera (isla cliente de la app). */
  carrito?: ReactNode;
  /** `liso`: fondo blanco (el del tema) en lugar del cielo de escena. */
  fondo?: "escena" | "liso";
}

/**
 * Marco de la tienda y de la compra: cabecera y fondo de escena (cielo que se
 * funde con el plomo) a todo el ancho, el mismo de ingresar y crear cuenta.
 */
export function PaginaTienda({
  children,
  cabecera = "siempre",
  categorias,
  carrito,
  fondo = "escena",
}: PropsPaginaTienda) {
  const clases = ["ui-pagina-tienda"];
  clases.push(fondo === "liso" ? "ui-pagina-tienda--lisa" : "ui-fondo-escena");
  if (cabecera === "solo-escritorio") clases.push("ui-pagina-tienda--sin-cabecera-movil");

  return (
    <div className={clases.join(" ")}>
      <Header {...(categorias ? { categorias } : {})} {...(carrito ? { carrito } : {})} />
      {children}
    </div>
  );
}
