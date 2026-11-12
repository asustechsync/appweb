import { EscaparatePortada } from "@appweb/ui";
import type { Metadata } from "next";

import {
  bannersDePortada,
  envioGratisDesde,
  marcas,
  nivelesDePortada,
  packsDePortada,
  productosEnOferta,
  productosMasVendidos,
  productosNuevos,
} from "@/lib/consultas";
import { whatsappPack } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Boxers y básicos para todos los días",
  description:
    "Encuentra boxers cómodos y básicos para hombre. Revisa tallas, opciones de envío y compra segura en nuestra tienda.",
};

/** CLASE A — portada "packs primero". Todo sale de funciones cacheadas. */
export default async function PaginaPortada() {
  const [productos, masVendidos, ofertas, packs, banners, listaMarcas, niveles, envioGratis] =
    await Promise.all([
      productosNuevos(8),
      productosMasVendidos(8),
      productosEnOferta(10),
      packsDePortada(4),
      bannersDePortada(),
      marcas(12),
      nivelesDePortada(),
      envioGratisDesde(),
    ]);

  return (
    <EscaparatePortada
      titulo="Básicos para todos los días"
      subtitulo="Boxers, medias y accesorios cómodos. Lleva tu pack, elige tu talla y recíbelo en todo el Perú."
      productos={productos}
      masVendidos={masVendidos}
      ofertas={ofertas}
      packs={packs.map((pack) => ({ ...pack, hrefPedido: whatsappPack(pack) }))}
      banners={banners}
      marcas={listaMarcas}
      niveles={niveles}
      envioGratisDesde={envioGratis}
    />
  );
}
