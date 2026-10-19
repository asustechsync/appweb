import { PaginaTienda } from "@appweb/ui";

import { BotonCarritoCabecera } from "@/app/BotonCarritoCabecera";
import { categoriasDeNavegacion } from "@/lib/consultas";
import { ContenidoNoEncontrado } from "@/lib/no-encontrado";
import { PieTienda } from "@/lib/pie";

export const metadata = { title: "Página no encontrada" };

/**
 * 404 de las rutas que no existen. Aqui no hay layout de grupo encima, asi
 * que trae la cabecera y el pie de la tienda para que haya por donde seguir;
 * las categorias salen de la funcion cacheada, como en el layout. La ficha y
 * el pedido tienen su propio not-found, dentro de su layout.
 */
export default async function NoEncontrada() {
  const categorias = await categoriasDeNavegacion();
  return (
    <PaginaTienda categorias={categorias} carrito={<BotonCarritoCabecera />} pie={<PieTienda />}>
      <ContenidoNoEncontrado />
    </PaginaTienda>
  );
}
