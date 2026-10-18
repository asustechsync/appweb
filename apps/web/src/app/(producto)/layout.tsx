import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";
import { BotonCarritoCabecera } from "@/app/BotonCarritoCabecera";

/**
 * Layout del detalle de producto — CLASE A.
 * Igual que el de la tienda, con cabecera en movil y escritorio, y fondo liso.
 * No lee cookies.
 */
export default async function LayoutProducto({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDeNavegacion();
  return (
    <PaginaTienda
      fondo="liso"
      carritoJuntoAlBuscador
      categorias={categorias}
      carrito={<BotonCarritoCabecera />}
    >
      {children}
    </PaginaTienda>
  );
}
