import type { MetadataRoute } from "next";

import { categoriasDeNavegacion, slugsDeMarcas, slugsDeProductos } from "@/lib/consultas";
import { URL_TIENDA } from "@appweb/api/urls";

/** Paginas fijas que vale la pena indexar. Las legales tambien: las pide la norma. */
const PAGINAS = [
  "",
  "/envios",
  "/guia-tallas",
  "/mayorista",
  "/ayuda/cambios-y-devoluciones",
  "/ayuda/preguntas-frecuentes",
  "/ayuda/contacto",
  "/terminos",
  "/privacidad",
  "/libro-de-reclamaciones",
];

/**
 * Mapa del sitio para los buscadores. Sale de las mismas funciones cacheadas
 * que la tienda (Clase A): no consulta la base en cada visita del robot.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorias, productos, marcas] = await Promise.all([
    categoriasDeNavegacion(),
    slugsDeProductos(),
    slugsDeMarcas(),
  ]);
  return [
    ...PAGINAS.map((ruta) => ({ url: `${URL_TIENDA}${ruta}` })),
    ...categorias.map((c) => ({ url: `${URL_TIENDA}/categorias/${c.slug}` })),
    ...productos.map((slug) => ({ url: `${URL_TIENDA}/productos/${slug}` })),
    ...marcas.map((slug) => ({ url: `${URL_TIENDA}/marcas/${slug}` })),
  ];
}
