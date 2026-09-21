import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import {
  crearContexto,
  enrutador,
  sesionDesdeToken,
  tokenDeCabeceraCookie,
} from "@appweb/api";

/**
 * Datos de /mi-cuenta (CLASE C).
 *
 * El mismo enrutador que usa el panel: una sola definicion de que puede pedir
 * cada rol. Aqui solo se traduce la cookie a la sesion del contexto; quien
 * decide si el procedimiento es publico, privado o exige un permiso es
 * @appweb/api.
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
