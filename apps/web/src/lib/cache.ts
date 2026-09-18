/**
 * Etiquetas de cache. TODA invalidacion pasa por aqui.
 *
 * El panel guarda un producto -> invalida su etiqueta -> se regenera SOLO esa
 * pagina. Si las etiquetas se escribieran a mano en cada sitio, tarde o
 * temprano una quedaria mal escrita y esa pagina se serviria vieja para
 * siempre, sin dar ningun error.
 */

export const etiquetas = {
  /** Menu y arbol de categorias: lo usa la cabecera de todas las paginas. */
  navegacion: () => "navegacion",

  /** Portada. */
  portada: () => "portada",

  /** Listado de una categoria, con cualquier combinacion de filtros. */
  categoria: (slug: string) => `categoria:${slug}`,

  /** Ficha de un producto. */
  producto: (slug: string) => `producto:${slug}`,

  /** Todo el catalogo. Solo para cambios masivos: invalida mucho. */
  catalogo: () => "catalogo",

  /** Metodos de envio: los lee el checkout. */
  envios: () => "envios",
} as const;

/** Etiquetas a invalidar cuando se guarda un producto desde el panel. */
export function etiquetasDeProducto(slug: string, slugCategoria: string): string[] {
  return [
    etiquetas.producto(slug),
    etiquetas.categoria(slugCategoria),
    etiquetas.portada(),
  ];
}
