import Link from "next/link";

import { IconoCarrito, IconoUsuario } from "../iconos";

import "./primitivos.css";

export interface PropsAccionesCuenta {
  hrefUsuario?: string;
  hrefCarrito?: string;
}

/**
 * Accesos a cuenta, pedidos y carrito en la cabecera.
 */
export function AccionesCuenta({
  hrefUsuario = "/ingresar",
  hrefCarrito = "/carrito",
}: PropsAccionesCuenta) {
  return (
    <div className="ui-acciones-cuenta">
      <Link
        href={hrefUsuario}
        aria-label="Mi cuenta"
        title="Mi cuenta"
      >
        <IconoUsuario />
      </Link>
      <Link href={hrefCarrito} aria-label="Carrito" title="Carrito">
        <IconoCarrito />
      </Link>
    </div>
  );
}
