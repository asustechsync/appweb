import Link from "next/link";

import { IconoCarrito } from "../../iconos";

import "../estilos.css";

export interface PropsBotonCarrito {
  href?: string;
  /** Unidades en el carrito; con 0 o sin valor no se muestra insignia. */
  cantidad?: number;
}

/**
 * Boton de carrito: icono de bolsa, enlace a `/carrito` e insignia opcional con
 * las unidades. Lo usan la cabecera y la barra movil; el contenedor decide el
 * tamano, este componente solo pone la piel.
 */
export function BotonCarrito({ href = "/carrito", cantidad = 0 }: PropsBotonCarrito) {
  return (
    <Link
      href={href}
      className="ui-boton-carrito"
      title="Carrito"
      aria-label={cantidad > 0 ? `Ver carrito, ${cantidad} unidades` : "Ver carrito"}
    >
      <IconoCarrito />
      {cantidad > 0 ? (
        <span className="ui-boton-carrito__contador" aria-hidden="true">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      ) : null}
    </Link>
  );
}
