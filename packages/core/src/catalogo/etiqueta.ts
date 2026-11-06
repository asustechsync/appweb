/**
 * La etiqueta "Nuevo" vence: pasado `nuevoHasta` deja de mostrarse. Las demas
 * etiquetas ("Oferta", "Top") no vencen.
 */

const ETIQUETA_NUEVO = "nuevo";

/** `hoy` y `nuevoHasta` en "aaaa-mm-dd": se comparan como texto, sin husos horarios. */
export function etiquetaVigente(
  etiqueta: string | null,
  nuevoHasta: string | null,
  hoy: string,
): string | null {
  if (etiqueta === null) return null;
  const vencida =
    etiqueta.trim().toLowerCase() === ETIQUETA_NUEVO && nuevoHasta !== null && nuevoHasta < hoy;
  return vencida ? null : etiqueta;
}
