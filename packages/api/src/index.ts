import { accesoApp } from "./rutas/acceso";
import { catalogo } from "./rutas/catalogo";
import { cuenta } from "./rutas/cuenta";
import { atributos } from "./rutas/panel/atributos";
import { avisos } from "./rutas/panel/avisos";
import { categorias, marcas } from "./rutas/panel/categorias";
import { devoluciones } from "./rutas/panel/devoluciones";
import { envios } from "./rutas/panel/envios";
import { niveles } from "./rutas/panel/niveles";
import { resumen } from "./rutas/panel/resumen";
import { packs } from "./rutas/panel/packs";
import { pagos } from "./rutas/panel/pagos";
import { pedidos } from "./rutas/panel/pedidos";
import { productos } from "./rutas/panel/productos";
import { promociones } from "./rutas/panel/promociones";
import { proveedores } from "./rutas/panel/proveedores";
import { reclamos } from "./rutas/panel/reclamos";
import { resenas } from "./rutas/panel/resenas";
import { stock } from "./rutas/panel/stock";
import { usuarios } from "./rutas/panel/usuarios";
import { tienda } from "./rutas/tienda";
import { router } from "./trpc";

export { crearContexto, type Contexto, type LecturasCatalogo, type Sesion } from "./trpc";
export { publico, privado, exige, router } from "./trpc";
export {
  COOKIE_SESION,
  opcionesCookieSesion,
  secretoSesion,
  sesionDesdeToken,
  tokenDeCabeceraCookie,
  tokenDePeticion,
} from "./sesion";
export { nivelDeUsuario, nivelesVigentes } from "./clientes";
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
  acceso: accesoApp,
  catalogo,
  cuenta,
  tienda,
  panel: router({
    resumen,
    avisos,
    envios,
    pedidos,
    pagos,
    devoluciones,
    reclamos,
    resenas,
    productos,
    categorias,
    marcas,
    atributos,
    proveedores,
    packs,
    stock,
    usuarios,
    promociones,
    niveles,
  }),
});

export type Enrutador = typeof enrutador;
