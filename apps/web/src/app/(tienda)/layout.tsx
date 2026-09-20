import { Cabecera } from "@appweb/ui";

import { SECCIONES } from "@/lib/secciones";

/**
 * Layout de la tienda publica — CLASE A.
 *
 * La cabecera es casi toda HTML estatico: solo SelectorUbicacion, AlternarTema
 * y el item "desplegable" (Ayuda) son islas cliente. Las secciones de la barra
 * viven en @/lib/secciones porque el layout de compra usa la misma lista.
 */
export default function LayoutTienda({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecera secciones={SECCIONES} />
      {children}
    </>
  );
}
