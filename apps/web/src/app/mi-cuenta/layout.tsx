import { PaginaTienda } from "@appweb/ui";

/**
 * Layout de /mi-cuenta.
 * Mismo marco que la tienda: cabecera y fondo plomo.
 */
export default function LayoutMiCuenta({ children }: { children: React.ReactNode }) {
  return <PaginaTienda>{children}</PaginaTienda>;
}
