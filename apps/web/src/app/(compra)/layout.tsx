import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";
import { BotonCarritoCabecera } from "@/app/BotonCarritoCabecera";

/**
 * Layout de compra — CLASE B (carrito y checkout).
 * Mismo aspecto que el detalle de producto: fondo liso y carrito junto
 * al buscador. La cabecera es estatica: la sesion entra por la isla cliente de
 * adentro.
 */
export default async function LayoutCompra({ children }: { children: React.ReactNode }) {
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
