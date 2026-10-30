import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { crearContexto, enrutador, sesionDesdeToken, tokenDePeticion } from "@appweb/api";
import { ipDeCabeceras } from "@appweb/api/limites";

import {
  bannersDePortada,
  buscarProductos,
  categoriaPorSlug,
  categoriasDeNavegacion,
  facetasDeCategoria,
  marcaConProductos,
  productosDeCategoria,
  productosEnOferta,
  productoPorSlug,
  productosNuevos,
  productosPorSlugs,
  varianteParaCarrito,
} from "@/lib/consultas";

/**
 * Datos de /mi-cuenta (CLASE C) y todo lo que pide la app movil.
 *
 * El mismo enrutador que usa el panel: una sola definicion de que puede pedir
 * cada rol. Aqui solo se traduce el token (cookie en la web, cabecera
 * `Authorization` en la app) a la sesion del contexto; quien decide si el
 * procedimiento es publico, privado o exige un permiso es @appweb/api.
 */
function manejar(peticion: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: peticion,
    router: enrutador,
    createContext: () =>
      crearContexto(
        sesionDesdeToken(tokenDePeticion(peticion.headers)),
        {
          // Las lecturas cacheadas de la tienda: la app no toca la base en cada visita.
          novedades: productosNuevos,
          ofertas: productosEnOferta,
          categorias: categoriasDeNavegacion,
          banners: bannersDePortada,
          ficha: productoPorSlug,
          variante: varianteParaCarrito,
          categoria: categoriaPorSlug,
          facetas: facetasDeCategoria,
          listado: productosDeCategoria,
          busqueda: buscarProductos,
          marca: marcaConProductos,
          porSlugs: productosPorSlugs,
        },
        ipDeCabeceras(peticion.headers),
      ),
  });
}

export { manejar as GET, manejar as POST };
