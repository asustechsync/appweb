import { EscaparatePortada, Header, type PropsBeneficio } from "@appweb/ui";
import type { Metadata } from "next";

import { productosNuevos } from "@/lib/consultas";


export const metadata: Metadata = {
  title: "Boxers y básicos para todos los días",
  description:
    "Encuentra boxers cómodos y básicos para hombre. Revisa tallas, opciones de envío y compra segura en nuestra tienda.",
};

const beneficios: PropsBeneficio[] = [
  { etiqueta: "Seguridad", titulo: "Compra segura", detalle: "Pago protegido" },
  { etiqueta: "Envíos", titulo: "Envíos nacionales", detalle: "A todo el Perú" },
  { etiqueta: "Garantía", titulo: "Respaldo", detalle: "En cada pedido" },
  { etiqueta: "Soporte", titulo: "Atención", detalle: "Resolvemos tus consultas" },
];

/** CLASE A — portada. Layout con estructura de producto. */
export default async function PaginaPortada() {
  const [productoColeccion] = await productosNuevos(1);

  return (
    <>
      <Header />
      <EscaparatePortada
        nombre="Boxer Botánico"
        subtitulo="Comodidad premium para todos los días"
        imagen="/producto.webp"
        categoria="Nueva colección"
        precio="S/ 39.90"
        beneficios={beneficios}
        productoColeccion={productoColeccion}
      />
    </>
  );
}
