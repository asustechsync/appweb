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
 * las unidades. Tamaño y forma salen de `ui-boton-icono`, igual que el resto
 * de botones de las cabeceras.
 */
export function BotonCarrito({ href = "/carrito", cantidad = 0 }: PropsBotonCarrito) {
  return (
    <Link
      href={href}
      className="ui-boton-icono"
      title="Carrito"
      aria-label={cantidad > 0 ? `Ver carrito, ${cantidad} unidades` : "Ver carrito"}
    >
      <IconoCarrito />
      {cantidad > 0 ? (
        <span className="ui-boton-icono__insignia ui-boton-carrito__contador" aria-hidden="true">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      ) : null}
    </Link>
  );
}
