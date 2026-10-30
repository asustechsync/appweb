import type { Enrutador } from "@appweb/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import Constants from "expo-constants";

/**
 * Direccion de la tienda web, que sirve /api/trpc.
 *
 * En desarrollo el celular no puede usar `localhost` (seria el propio
 * celular): se toma la IP de la PC desde la que Expo sirve la app y se apunta
 * al puerto de la tienda. `EXPO_PUBLIC_API_URL` la fija para un build real.
 */
function urlDeLaTienda(): string {
  const fija = process.env.EXPO_PUBLIC_API_URL;
  if (fija) return fija;
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return `http://${host}:3000`;
}

const TIENDA = urlDeLaTienda();

/**
 * Token de la sesion abierta. Lo fija `estado-sesion` al ingresar o al leerlo
 * del almacen seguro; el cliente lo manda en cada peticion.
 */
let tokenActual: string | null = null;

export function usarToken(token: string | null): void {
  tokenActual = token;
}

export const api = createTRPCClient<Enrutador>({
  links: [
    httpBatchLink({
      url: `${TIENDA}/api/trpc`,
      headers: () => (tokenActual ? { authorization: `Bearer ${tokenActual}` } : {}),
    }),
  ],
});

/**
 * Pide a la tienda que regenere lo que cambio el panel (stock, reseñas...).
 * Unico camino de la app a la cache de la tienda: las etiquetas viven en el
 * servidor. El dato ya quedo guardado; si esto falla, la tienda solo tarda en
 * mostrar el cambio, por eso devuelve `false` en vez de lanzar.
 */
export async function revalidarTienda(
  productos: { slug: string; slugCategoria: string }[],
): Promise<boolean> {
  if (productos.length === 0 || !tokenActual) return true;
  try {
    const respuesta = await fetch(`${TIENDA}/api/panel/revalidar-catalogo`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${tokenActual}` },
      body: JSON.stringify({ productos }),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}

/** Las fotos guardadas con ruta relativa ("/fotos/...") se piden a la tienda. */
export function urlDeImagen(url: string): string {
  return url.startsWith("/") ? `${TIENDA}${url}` : url;
}
