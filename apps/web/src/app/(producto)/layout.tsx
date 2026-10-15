import { Manrope } from "next/font/google";
import localFont from "next/font/local";

import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";
import { BotonCarritoCabecera } from "@/app/BotonCarritoCabecera";

/** Manrope para el titulo de la ficha: se carga aqui y no en el layout raiz. */
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/** Satoshi, local (apps/web/src/app/fuentes/satoshi), para la cifra del precio de la ficha. */
const satoshi = localFont({
  display: "swap",
  src: [
    { path: "../fuentes/satoshi/Satoshi-Regular.woff", weight: "400", style: "normal" },
    { path: "../fuentes/satoshi/Satoshi-Medium.woff", weight: "500", style: "normal" },
    { path: "../fuentes/satoshi/Satoshi-Bold.woff", weight: "700", style: "normal" },
  ],
});

/**
 * Layout del detalle de producto — CLASE A.
 * Igual que el de la tienda, con cabecera en movil y escritorio, y fondo liso.
 * No lee cookies.
 */
export default async function LayoutProducto({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDeNavegacion();
  const estilo = {
    "--tipo-familia-acceso": `${manrope.style.fontFamily}, system-ui, sans-serif`,
    "--tipo-familia-precio": `${satoshi.style.fontFamily}, system-ui, sans-serif`,
  };
  return (
    <div style={estilo as React.CSSProperties}>
      <PaginaTienda fondo="liso" categorias={categorias} carrito={<BotonCarritoCabecera />}>
        {children}
      </PaginaTienda>
    </div>
  );
}
