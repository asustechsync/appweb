import { headers } from "next/headers";

import { ipDeCabeceras } from "@appweb/api/limites";

export { limites } from "@appweb/api/limites";

/**
 * IP de quien hace el pedido, para las server actions. Solo se usa en ellas,
 * que ya son dinamicas: leer `headers()` aqui no vuelve dinamica ninguna pagina.
 */
export async function ipDelCliente(): Promise<string> {
  return ipDeCabeceras(await headers());
}
