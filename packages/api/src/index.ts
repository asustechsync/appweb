import { cuenta } from "./rutas/cuenta";
import { avisos } from "./rutas/panel/avisos";
import { envios } from "./rutas/panel/envios";
import { resumen } from "./rutas/panel/resumen";
import { pedidos } from "./rutas/panel/pedidos";
import { productos } from "./rutas/panel/productos";
import { promociones } from "./rutas/panel/promociones";
import { reclamos } from "./rutas/panel/reclamos";
import { resenas } from "./rutas/panel/resenas";
import { stock } from "./rutas/panel/stock";
import { usuarios } from "./rutas/panel/usuarios";
import { router } from "./trpc";

export { crearContexto, type Contexto, type Sesion } from "./trpc";
export { publico, privado, exige, router } from "./trpc";
export {
  COOKIE_SESION,
  opcionesCookieSesion,
  secretoSesion,
  sesionDesdeToken,
  tokenDeCabeceraCookie,
} from "./sesion";
export { nivelDeUsuario } from "./clientes";
export { subirImagenProducto, type ResultadoSubida } from "./imagenes";

/**
 * Enrutador raiz. Las rutas se añaden en src/rutas/ conforme se construyen:
 *
 *   catalogo  -> publico       listados y ficha
 *   carrito   -> publico       lineas y totales
 *   cuenta    -> privado       pedidos y direcciones del cliente
 *   panel     -> exige(...)    productos, pedidos, reclamos, reseñas, envios, usuarios
 */
export const enrutador = router({
  cuenta,
  panel: router({
    resumen,
    avisos,
    envios,
    pedidos,
    reclamos,
    resenas,
    productos,
    stock,
    usuarios,
    promociones,
  }),
});

export type Enrutador = typeof enrutador;
