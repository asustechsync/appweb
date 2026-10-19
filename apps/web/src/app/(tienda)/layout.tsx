import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";
import { BotonCarritoCabecera } from "@/app/BotonCarritoCabecera";
import { PieTienda } from "@/lib/pie";
import { whatsappTienda } from "@/lib/whatsapp";

/**
 * Layout de la tienda publica — CLASE A.
 * Cabecera, pie y fondo plomo comunes; no lee cookies (la sesion entra por la
 * isla cliente de la cabecera). El pie lleva el Libro de Reclamaciones, que la
 * norma pide visible desde la portada. El boton flotante de WhatsApp va solo
 * aqui: en la ficha y en la compra taparia la barra fija del pie.
 */
export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDeNavegacion();
  return (
    <PaginaTienda
      categorias={categorias}
      carrito={<BotonCarritoCabecera />}
      whatsapp={whatsappTienda()}
      pie={<PieTienda />}
    >
      {children}
    </PaginaTienda>
  );
}
