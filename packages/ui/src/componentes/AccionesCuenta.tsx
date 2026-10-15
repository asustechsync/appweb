import type { ReactNode } from "react";

import { BotonCarrito } from "./BotonCarrito";
import { MenuUsuario } from "./MenuUsuario";

import "./primitivos.css";

export interface PropsAccionesCuenta {
  hrefCarrito?: string;
  /** Boton de carrito con contador (isla cliente de la app). Sin el, el
      carrito se ve sin insignia y la cabecera sigue siendo estatica. */
  carrito?: ReactNode;
  /** Solo el carrito, sin menu de usuario (cabecera movil con el carrito abajo). */
  soloCarrito?: boolean;
}

/**
 * Accesos a carrito y cuenta en la cabecera. El tema se cambia desde el menu
 * de usuario.
 */
export function AccionesCuenta({
  hrefCarrito = "/carrito",
  carrito,
  soloCarrito = false,
}: PropsAccionesCuenta) {
  return (
    <div className="ui-acciones-cuenta">
      <span className="ui-acciones-cuenta__carrito">{carrito ?? <BotonCarrito href={hrefCarrito} />}</span>
      {soloCarrito ? null : <MenuUsuario />}
    </div>
  );
}
