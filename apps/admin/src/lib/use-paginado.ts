"use client";

import { useMemo, useState } from "react";

/**
 * Parte en paginas una lista ya filtrada. Si el filtro deja menos paginas, la
 * actual se ajusta sola; al cambiar el filtro conviene volver a la 1.
 */
export function usePaginado<T>(elementos: T[], porPagina: number) {
  const [pagina, setPagina] = useState(1);
  const paginas = Math.max(1, Math.ceil(elementos.length / porPagina));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = useMemo(
    () => elementos.slice((paginaActual - 1) * porPagina, paginaActual * porPagina),
    [elementos, paginaActual, porPagina],
  );
  return { pagina: paginaActual, paginas, setPagina, visibles };
}
