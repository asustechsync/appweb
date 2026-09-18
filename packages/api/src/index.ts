import { router } from "./trpc";

export { crearContexto, type Contexto, type Sesion } from "./trpc";
export { publico, privado, exige, router } from "./trpc";

/**
 * Enrutador raiz. Las rutas se añaden en src/rutas/ conforme se construyen:
 *
 *   catalogo  -> publico       listados y ficha
 *   carrito   -> publico       lineas y totales
 *   cuenta    -> privado       pedidos y direcciones del cliente
 *   panel     -> exige(...)    productos, pedidos, envios, usuarios
 */
export const enrutador = router({});

export type Enrutador = typeof enrutador;
