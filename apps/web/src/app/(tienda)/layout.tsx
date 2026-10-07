import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";

/**
 * Layout de la tienda publica — CLASE A.
 * Cabecera y fondo plomo comunes; no lee cookies (la sesion entra por la isla
 * cliente de la cabecera).
 */
export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDeNavegacion();
  return <PaginaTienda categorias={categorias}>{children}</PaginaTienda>;
}
