import { EscaparatePortada } from "@appweb/ui";
import type { Metadata } from "next";

import { bannersDePortada, marcas, productosEnOferta, productosNuevos } from "@/lib/consultas";

export const metadata: Metadata = {
  title: "Boxers y básicos para todos los días",
  description:
    "Encuentra boxers cómodos y básicos para hombre. Revisa tallas, opciones de envío y compra segura en nuestra tienda.",
};

/** CLASE A — portada. Layout con estructura de producto. */
export default async function PaginaPortada() {
  const [productos, ofertas, banners, listaMarcas] = await Promise.all([
    productosNuevos(5),
    productosEnOferta(10),
    bannersDePortada(),
    marcas(12),
  ]);

  return (
    <EscaparatePortada
      titulo="Básicos para todos los días"
      subtitulo="Boxers, medias y accesorios cómodos. Elige tu talla y recíbelos en todo el Perú."
      productos={productos}
      ofertas={ofertas}
      banners={banners}
      marcas={listaMarcas}
    />
  );
}
