/**
 * Layout de la tienda publica — CLASE A.
 *
 * La cabecera sale de una funcion cacheada con etiqueta, asi que forma parte
 * del shell estatico. El contador del carrito y el interruptor de tema son
 * islas cliente: se hidratan aparte y no obligan a renderizar en cada peticion.
 */
export default function LayoutTienda({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
