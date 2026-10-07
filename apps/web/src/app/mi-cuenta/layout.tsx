import { Poppins } from "next/font/google";

import { PaginaTienda } from "@appweb/ui";

import { categoriasDeNavegacion } from "@/lib/consultas";

/**
 * Misma Poppins que ingresar y registro: se carga aqui y no en el layout raiz
 * para que el resto del sitio no descargue estos archivos.
 */
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/**
 * Layout de /mi-cuenta.
 * Mismo marco que la tienda: cabecera y fondo plomo. La fuente solo cubre el
 * contenido de la cuenta; la cabecera conserva la de la marca.
 */
export default async function LayoutMiCuenta({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDeNavegacion();
  const estilo = { "--tipo-familia-acceso": `${poppins.style.fontFamily}, system-ui, sans-serif` };
  return (
    <PaginaTienda cabecera="solo-escritorio" categorias={categorias}>
      <div style={estilo as React.CSSProperties}>{children}</div>
    </PaginaTienda>
  );
}
