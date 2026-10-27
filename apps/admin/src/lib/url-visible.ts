import { URL_TIENDA } from "@appweb/api/urls";

/** En local las fotos quedan en la tienda ("/subidas/..."): el panel les antepone su dominio. */
export function urlVisible<T extends string | null>(url: T): T {
  return (url?.startsWith("/") ? `${URL_TIENDA}${url}` : url) as T;
}
