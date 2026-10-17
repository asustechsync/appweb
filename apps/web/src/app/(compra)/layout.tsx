import { Manrope } from "next/font/google";

import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";
import { BotonCarritoCabecera } from "@/app/BotonCarritoCabecera";

/**
 * Manrope para carrito y checkout, igual que el detalle de producto: se carga
 * aqui y no en el layout raiz para que el resto del sitio no descargue estos
 * archivos.
 */
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/**
 * Layout de compra — CLASE B (carrito y checkout).
 * Mismo aspecto que el detalle de producto: fuente, fondo liso y carrito junto
 * al buscador. La cabecera es estatica: la sesion entra por la isla cliente de
 * adentro.
 */
export default async function LayoutCompra({ children }: { children: React.ReactNode }) {
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
