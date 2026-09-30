import { PaginaTienda } from "@appweb/ui";

/**
 * Layout de la tienda publica — CLASE A.
 * Cabecera y fondo plomo comunes; no lee cookies (la sesion entra por la isla
 * cliente de la cabecera).
 */
export default function LayoutTienda({ children }: { children: React.ReactNode }) {
  return <PaginaTienda>{children}</PaginaTienda>;
}
