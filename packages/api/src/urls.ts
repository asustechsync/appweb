/**
 * Direcciones publicas de la tienda y del panel. Un solo sitio para las dos
 * apps, en el servidor y en el navegador.
 *
 * El acceso es literal (`process.env["NEXT_PUBLIC_..."]`) a proposito: Next
 * reemplaza ese texto por el valor al compilar el codigo del navegador, y no
 * lo haria si el nombre viniera de una variable. Por eso no pasa por
 * `entorno()`, que es solo de servidor.
 */

export const URL_TIENDA = process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000";
export const URL_PANEL = process.env["NEXT_PUBLIC_ADMIN_URL"] ?? "http://localhost:3001";

/**
 * Esquema con el que se abre la app movil (`appweb://...`). Tiene que coincidir
 * con `expo.scheme` de `apps/mobile/app.json`, que no puede importarlo.
 */
export const ESQUEMA_APP = "appweb";

/** La misma ruta de la tienda, pero abierta en la app movil si esta instalada. */
export const enlaceApp = (ruta: string) => `${ESQUEMA_APP}://${ruta.replace(/^\//, "")}`;

/**
 * Una URL publica vista desde el navegador actual. Si apunta a `localhost`
 * pero la pagina se abrio por otra direccion (el movil entrando por la IP de
 * la red local), `localhost` seria el propio telefono: se reemplaza el host
 * por el de la pagina y se conserva el puerto.
 */
function enNavegador(url: string): string {
  if (typeof window === "undefined") return url;
  const destino = new URL(url);
  const esLocal = destino.hostname === "localhost" || destino.hostname === "127.0.0.1";
  if (esLocal && window.location.hostname !== destino.hostname) {
    destino.hostname = window.location.hostname;
  }
  return destino.origin;
}

export const urlPanelEnNavegador = () => enNavegador(URL_PANEL);
export const urlTiendaEnNavegador = () => enNavegador(URL_TIENDA);
