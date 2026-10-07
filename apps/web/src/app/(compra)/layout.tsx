import { Poppins } from "next/font/google";

import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";

/**
 * Poppins para carrito y checkout: se carga aqui y no en el layout raiz para
 * que el resto del sitio no descargue estos archivos.
 */
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/**
 * Layout de compra — CLASE B (carrito y checkout).
 * La cabecera es estatica: la sesion entra por la isla cliente de adentro.
 */
export default async function LayoutCompra({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDeNavegacion();
  // La variable vive aqui y no en globals.css: alli se resolveria en <body>,
  // que es antes de que exista la fuente cargada por este layout.
  // Las cifras de la compra van en Bai Jamjuree (la base del sitio), no en Urbanist.
  const estilo = {
    "--tipo-familia-acceso": `${poppins.style.fontFamily}, system-ui, sans-serif`,
    "--tipo-familia-numeros": "var(--tipo-familia-base)",
  };
  return (
    <div style={estilo as React.CSSProperties}>
      <PaginaTienda categorias={categorias}>{children}</PaginaTienda>
    </div>
  );
}
