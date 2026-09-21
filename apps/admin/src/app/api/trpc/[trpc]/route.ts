import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import {
  crearContexto,
  enrutador,
  sesionDesdeToken,
  tokenDeCabeceraCookie,
} from "@appweb/api";

/**
 * Unico punto de entrada de datos del panel.
 *
 * El rol se comprueba dentro de cada procedimiento (`exige(...)` en
 * @appweb/api), no aqui: este handler solo traduce la cookie a la sesion del
 * contexto y deja que el enrutador decida que puede hacer quien pregunta.
 */
function manejar(peticion: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: peticion,
    router: enrutador,
    createContext: () =>
      crearContexto(sesionDesdeToken(tokenDeCabeceraCookie(peticion.headers.get("cookie")))),
  });
}

export { manejar as GET, manejar as POST };
