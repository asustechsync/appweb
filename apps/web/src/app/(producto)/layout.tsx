import { Manrope } from "next/font/google";

import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";
import { BotonCarritoCabecera } from "@/app/BotonCarritoCabecera";

/** Manrope para todo el detalle de producto: se carga aqui y no en el layout raiz. */
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/**
 * Layout del detalle de producto — CLASE A.
 * Igual que el de la tienda, con cabecera en movil y escritorio, y fondo liso.
 * No lee cookies.
 */
export default async function LayoutProducto({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDeNavegacion();
  // Todas las familias apuntan a Manrope; `fontFamily` hace falta porque el
  // body ya resolvio la base antes de llegar aqui.
  const familia = `${manrope.style.fontFamily}, system-ui, sans-serif`;
  const estilo = {
    "--tipo-familia-base": familia,
    "--tipo-familia-numeros": familia,
    "--tipo-familia-acceso": familia,
    "--tipo-familia-precio": familia,
    "--tipo-familia-buscador": familia,
    fontFamily: familia,
  };
  return (
    <div style={estilo as React.CSSProperties}>
      <PaginaTienda fondo="liso" carritoJuntoAlBuscador categorias={categorias} carrito={<BotonCarritoCabecera />}>
        {children}
      </PaginaTienda>
    </div>
  );
}
