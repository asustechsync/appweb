import { cuenta } from "./rutas/cuenta";
import { resumen } from "./rutas/panel/resumen";
import { usuarios } from "./rutas/panel/usuarios";
import { coleccionPortada } from "./rutas/panel/coleccion-portada";
import { router } from "./trpc";

export { crearContexto, type Contexto, type Sesion } from "./trpc";
export { publico, privado, exige, router } from "./trpc";
export { COOKIE_SESION, sesionDesdeToken, tokenDeCabeceraCookie } from "./sesion";

/**
 * Enrutador raiz. Las rutas se añaden en src/rutas/ conforme se construyen:
 *
 *   catalogo  -> publico       listados y ficha
 *   carrito   -> publico       lineas y totales
 *   cuenta    -> privado       pedidos y direcciones del cliente
 *   panel     -> exige(...)    productos, pedidos, envios, usuarios
 */
export const enrutador = router({
  cuenta,
  panel: router({
    resumen,
    usuarios,
    coleccionPortada,
  }),
});

export type Enrutador = typeof enrutador;
