import { IconoCarrito, IconoUsuario } from "../iconos";

import "./primitivos.css";

export interface PropsAccionesCuenta {
  hrefUsuario?: string;
  hrefCarrito?: string;
}

/**
 * Accesos de cuenta y carrito en la cabecera.
 *
 * Componente de servidor, sin JS propio. El dia que el carrito muestre un
 * contador de unidades, esa sera una isla cliente aparte montada encima del
 * icono — no reemplaza este componente ni le añade estado.
 */
export function AccionesCuenta({
  hrefUsuario = "/ingresar",
  hrefCarrito = "/carrito",
}: PropsAccionesCuenta) {
  return (
    <div className="ui-acciones-cuenta">
      <a href={hrefUsuario} aria-label="Mi cuenta" title="Mi cuenta">
        <IconoUsuario />
      </a>
      <a href={hrefCarrito} aria-label="Carrito" title="Carrito">
        <IconoCarrito />
      </a>
    </div>
  );
}
