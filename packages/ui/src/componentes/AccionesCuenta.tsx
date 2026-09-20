import Link from "next/link";

import { IconoCarrito, IconoPedidos, IconoUsuario } from "../iconos";

import "./primitivos.css";

export interface PropsAccionesCuenta {
  hrefUsuario?: string;
  hrefPedidos?: string;
  hrefCarrito?: string;
}

/**
 * Accesos de cuenta, pedidos y carrito en la cabecera.
 *
 * Componente de servidor, sin JS propio. El dia que el carrito muestre un
 * contador de unidades, esa sera una isla cliente aparte montada encima del
 * icono — no reemplaza este componente ni le añade estado.
 */
export function AccionesCuenta({
  hrefUsuario = "/ingresar",
  hrefPedidos = "/mi-cuenta/pedidos",
  hrefCarrito = "/carrito",
}: PropsAccionesCuenta) {
  return (
    <div className="ui-acciones-cuenta">
      <Link href={hrefUsuario} aria-label="Mi cuenta" title="Mi cuenta">
        <IconoUsuario />
      </Link>
      <Link href={hrefPedidos} aria-label="Mis pedidos" title="Mis pedidos">
        <IconoPedidos />
      </Link>
      <Link href={hrefCarrito} aria-label="Carrito" title="Carrito">
        <IconoCarrito />
      </Link>
    </div>
  );
}
