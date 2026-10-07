import { EscaparatePortada } from "@appweb/ui";
import type { Metadata } from "next";
import localFont from "next/font/local";

import { contenidoColeccionPortada, productosNuevos } from "@/lib/consultas";


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

/** CLASE A — portada. Layout con estructura de producto. */
export default async function PaginaPortada() {
  const [productos, ingresos, coleccion] = await Promise.all([
    productosNuevos(5),
    productosNuevos(10),
    contenidoColeccionPortada(),
  ]);

  return (
    <div style={{ "--tipo-familia-acceso": `${satoshi.style.fontFamily}, system-ui, sans-serif` } as React.CSSProperties}>
      <EscaparatePortada
        titulo="Básicos para todos los días"
        subtitulo="Boxers, medias y accesorios cómodos. Elige tu talla y recíbelos en todo el Perú."
        productos={productos}
        ingresos={ingresos}
        coleccion={coleccion}
      />
    </div>
  );
}
