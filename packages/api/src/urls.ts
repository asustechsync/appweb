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
