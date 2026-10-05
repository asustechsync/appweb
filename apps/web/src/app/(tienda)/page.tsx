import { EscaparatePortada } from "@appweb/ui";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { contenidoColeccionPortada, productosEnOferta, productosNuevos } from "@/lib/consultas";


export const metadata: Metadata = {
  title: "Boxers y básicos para todos los días",
  description:
    "Encuentra boxers cómodos y básicos para hombre. Revisa tallas, opciones de envío y compra segura en nuestra tienda.",
};

/** Se carga aqui y no en el layout raiz: solo la portada descarga estos archivos. */
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

/** CLASE A — portada. Layout con estructura de producto. */
export default async function PaginaPortada() {
  const [productos, ofertas, ingresos, coleccion] = await Promise.all([
    productosNuevos(5),
    productosEnOferta(10),
    productosNuevos(10),
    contenidoColeccionPortada(),
  ]);

  return (
    <div style={{ "--tipo-familia-acceso": `${poppins.style.fontFamily}, system-ui, sans-serif` } as React.CSSProperties}>
      <EscaparatePortada
        titulo="Básicos para todos los días"
        subtitulo="Boxers, medias y accesorios cómodos. Elige tu talla y recíbelos en todo el Perú."
        productos={productos}
        ofertas={ofertas}
        ingresos={ingresos}
        coleccion={coleccion}
      />
    </div>
  );
}
