/**
 * Enlaces que abren la app (`appweb://...`, ver `enlaceApp` de @appweb/api/urls).
 * Usan las mismas rutas que la tienda web, para que un enlace sirva en las dos.
 */

/** Token de `.../recuperar-clave/nueva?token=...`, o null si el enlace es otro. */
export function tokenDeRecuperacion(url: string): string | null {
  const encontrado = /recuperar-clave\/nueva\?(?:[^#]*&)?token=([^&#]+)/.exec(url);
  if (!encontrado?.[1]) return null;
  try {
    return decodeURIComponent(encontrado[1]);
  } catch {
    return null;
  }
}
