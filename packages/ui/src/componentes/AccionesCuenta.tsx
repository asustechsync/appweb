import Link from "next/link";

import { IconoCarrito, IconoUsuario } from "../iconos";

import { AlternarTema } from "./AlternarTema";

import "./primitivos.css";

export interface PropsAccionesCuenta {
  hrefCarrito?: string;
}

/**
 * Accesos a cuenta, pedidos y carrito en la cabecera, mas el alternador de tema.
 */
export function AccionesCuenta({
  hrefCarrito = "/carrito",
}: PropsAccionesCuenta) {
  return (
    <div className="ui-acciones-cuenta">
      <AlternarTema />
      <Link href={hrefCarrito} aria-label="Carrito" title="Carrito">
        <IconoCarrito />
      </Link>
      {/* Siempre a /mi-cuenta: esa hoja lee la cookie y, sin sesion, redirige
          a /ingresar. Asi la cabecera sigue estatica y no necesita saber nada. */}
      <Link href="/mi-cuenta" aria-label="Mi cuenta" title="Mi cuenta">
        <IconoUsuario />
      </Link>
    </div>
  );
}
