import type { ReactNode } from "react";

import { BotonWhatsApp } from "../navegacion/BotonWhatsApp";
import { Header, type CategoriaDeCabecera } from "../navegacion/Header";

import "../estilos.css";

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
  /** En movil, el carrito ocupa el sitio del menu junto al buscador. */
  carritoJuntoAlBuscador?: boolean;
  /** Enlace wa.me de la tienda: muestra el boton flotante de WhatsApp. */
  whatsapp?: string | null;
  /** Pie de pagina (PiePagina). Queda pegado abajo aunque el contenido sea corto. */
  pie?: ReactNode;
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
  carritoJuntoAlBuscador = false,
  whatsapp = null,
  pie,
}: PropsPaginaTienda) {
  const clases = ["ui-pagina-tienda"];
  clases.push(fondo === "liso" ? "ui-pagina-tienda--lisa" : "ui-fondo-escena");
  if (cabecera === "solo-escritorio") clases.push("ui-pagina-tienda--sin-cabecera-movil");
  if (pie) clases.push("ui-pagina-tienda--con-pie");

  return (
    <div className={clases.join(" ")}>
      <Header
        {...(categorias ? { categorias } : {})}
        {...(carrito ? { carrito } : {})}
        carritoJuntoAlBuscador={carritoJuntoAlBuscador}
      />
      {children}
      {pie}
      {whatsapp ? <BotonWhatsApp href={whatsapp} /> : null}
    </div>
  );
}
