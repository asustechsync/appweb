import { Cabecera } from "@appweb/ui";

/**
 * Layout de la tienda publica — CLASE A.
 *
 * La cabecera es un componente de servidor puro: nada que hidratar, forma
 * parte del shell estatico igual que el resto de la pagina.
 */
export default function LayoutTienda({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecera />
      {children}
    </>
  );
}
