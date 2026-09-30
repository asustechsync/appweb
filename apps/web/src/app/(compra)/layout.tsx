import { PaginaTienda } from "@appweb/ui";

/**
 * Layout de compra — CLASE B (carrito y checkout).
 * La cabecera es estatica: la sesion entra por la isla cliente de adentro.
 */
export default function LayoutCompra({ children }: { children: React.ReactNode }) {
  return <PaginaTienda>{children}</PaginaTienda>;
}
