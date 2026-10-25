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
 * URL del panel vista desde el navegador actual. Si el panel apunta a
 * `localhost` pero la tienda se abrio por otra direccion (el movil entrando por
 * la IP de la red local), `localhost` seria el propio telefono: se reemplaza el
 * host por el de la pagina y se conserva el puerto del panel.
 */
export function urlPanelEnNavegador(): string {
  if (typeof window === "undefined") return URL_PANEL;
  const panel = new URL(URL_PANEL);
  const esLocal = panel.hostname === "localhost" || panel.hostname === "127.0.0.1";
  if (esLocal && window.location.hostname !== panel.hostname) {
    panel.hostname = window.location.hostname;
  }
  return panel.origin;
}
