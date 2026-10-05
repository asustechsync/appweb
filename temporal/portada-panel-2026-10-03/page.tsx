import { EscaparatePortada, type PropsBeneficio } from "@appweb/ui";
import type { Metadata } from "next";

import { contenidoColeccionPortada, productosNuevos } from "@/lib/consultas";


export const metadata: Metadata = {
  title: "Boxers y básicos para todos los días",
  description:
    "Encuentra boxers cómodos y básicos para hombre. Revisa tallas, opciones de envío y compra segura en nuestra tienda.",
};

const beneficios: PropsBeneficio[] = [
  { etiqueta: "Seguridad", titulo: "Protección", detalle: "En cada compra" },
  { etiqueta: "Envíos", titulo: "Nacionales", detalle: "A todo el Perú" },
  { etiqueta: "Garantía", titulo: "Respaldo", detalle: "En cada pedido" },
  { etiqueta: "Soporte", titulo: "Atención", detalle: "A tus consultas" },
];

/** CLASE A — portada. Layout con estructura de producto. */
export default async function PaginaPortada() {
  const [productos, coleccion] = await Promise.all([
    productosNuevos(5),
    contenidoColeccionPortada(),
  ]);

  return (
    <>
      <EscaparatePortada
        titulo="Básicos para todos los días"
        subtitulo="Boxers, medias y accesorios cómodos. Elige tu talla y recíbelos en todo el Perú."
        productos={productos}
        beneficios={beneficios}
        coleccion={coleccion}
      />
    </>
  );
}
