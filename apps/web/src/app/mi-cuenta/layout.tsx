import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";
import { BotonCarritoCabecera } from "@/app/BotonCarritoCabecera";

/**
 * Layout de /mi-cuenta.
 * Mismo marco que la tienda: cabecera y fondo plomo.
 */
export default async function LayoutMiCuenta({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDeNavegacion();
  return (
    <PaginaTienda
      cabecera="solo-escritorio"
      categorias={categorias}
      carrito={<BotonCarritoCabecera />}
    >
      {children}
    </PaginaTienda>
  );
}
