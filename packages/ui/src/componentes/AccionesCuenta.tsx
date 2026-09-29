import Link from "next/link";

import { IconoCarrito, IconoUsuario } from "../iconos";

import "./primitivos.css";

export interface PropsAccionesCuenta {
  hrefCarrito?: string;
}

/**
 * Accesos a cuenta, pedidos y carrito en la cabecera.
 */
export function AccionesCuenta({
  hrefCarrito = "/carrito",
}: PropsAccionesCuenta) {
  return (
    <div className="ui-acciones-cuenta">
      <Link href={hrefCarrito} aria-label="Carrito" title="Carrito">
        <IconoCarrito />
      </Link>
      <Link href="/ingresar" aria-label="Mi cuenta" title="Mi cuenta">
        <IconoUsuario />
      </Link>
    </div>
  );
}
