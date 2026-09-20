import { Cabecera } from "@appweb/ui";

import { SECCIONES } from "@/lib/secciones";

/**
 * Layout de compra — CLASE B (carrito y checkout).
 *
 * La cabecera es la misma de la tienda y sale del shell estatico; lo personal
 * (las lineas del carrito, los datos del checkout) llega despues, en islas
 * cliente. Aqui no se leen cookies: eso volveria dinamico el arbol.
 */
export default function LayoutCompra({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecera secciones={SECCIONES} />
      {children}
    </>
  );
}
