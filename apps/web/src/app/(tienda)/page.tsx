import { EscaparatePortada } from "@appweb/ui";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";

import { productosEnOferta, productosNuevos } from "@/lib/consultas";


export const metadata: Metadata = {
  title: "Boxers y básicos para todos los días",
  description:
    "Encuentra boxers cómodos y básicos para hombre. Revisa tallas, opciones de envío y compra segura en nuestra tienda.",
};

/**
 * Satoshi, local (apps/web/src/app/fuentes/satoshi). Se declara aqui y no en el
 * layout raiz: solo la portada descarga estos archivos. 600 cae en Bold.
 */
const satoshi = localFont({
  display: "swap",
  src: [
    { path: "../fuentes/satoshi/Satoshi-Regular.woff", weight: "400", style: "normal" },
    { path: "../fuentes/satoshi/Satoshi-Medium.woff", weight: "500", style: "normal" },
    { path: "../fuentes/satoshi/Satoshi-Bold.woff", weight: "700", style: "normal" },
  ],
});

/** Poppins para el texto de la tarjeta de producto; solo la portada la descarga. */
const poppins = Poppins({ subsets: ["latin"], display: "swap", weight: ["400", "500"] });

/** CLASE A — portada. Layout con estructura de producto. */
export default async function PaginaPortada() {
  const [productos, ofertas] = await Promise.all([productosNuevos(5), productosEnOferta(4)]);

  return (
    <div
      style={{
        "--tipo-familia-acceso": `${satoshi.style.fontFamily}, system-ui, sans-serif`,
        "--tipo-familia-tarjeta": `${poppins.style.fontFamily}, system-ui, sans-serif`,
      } as React.CSSProperties}
    >
      <EscaparatePortada
        titulo="Básicos para todos los días"
        subtitulo="Boxers, medias y accesorios cómodos. Elige tu talla y recíbelos en todo el Perú."
        productos={productos}
        ofertas={ofertas}
      />
    </div>
  );
}
