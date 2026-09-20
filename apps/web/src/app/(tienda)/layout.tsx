import { Cabecera, type SeccionDeNavegacion } from "@appweb/ui";

import { categoriasDestacadas } from "@/lib/consultas";

/**
 * Layout de la tienda publica — CLASE A.
 *
 * La cabecera es casi toda HTML estatico: solo SelectorUbicacion, AlternarTema
 * y los items "desplegable" (Categorias, Ayuda) son islas cliente.
 *
 * Las secciones de la barra combinan datos reales (categorias desde la base,
 * ancla de Marcas y de Ofertas/Nuevos Ingresos en la portada) con paginas de
 * contenido estatico nuevas (Guia de Tallas, Envios, Mayorista, Ayuda/*).
 * "Packs x3/x5" queda como `visual`: todavia no hay productos etiquetados
 * como pack en la base, asi que no apunta a ningun lado hasta que los haya.
 *
 * Los `/#...` en vez de `#...` son a proposito: esas anclas solo existen en
 * la portada, y la cabecera se renderiza en todas las paginas.
 */
export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const categorias = await categoriasDestacadas();

  const secciones: SeccionDeNavegacion[] = [
    {
      tipo: "desplegable",
      etiqueta: "Categorías",
      items: categorias.map((categoria) => ({
        etiqueta: categoria.nombre,
        href: `/categorias/${categoria.slug}`,
      })),
    },
    { tipo: "enlace", etiqueta: "Ofertas", href: "/#ofertas" },
    { tipo: "visual", etiqueta: "Packs x3/x5" },
    { tipo: "enlace", etiqueta: "Guía de Tallas", href: "/guia-tallas" },
    { tipo: "enlace", etiqueta: "Marcas", href: "/#marcas" },
    { tipo: "enlace", etiqueta: "Envío GRATIS desde S/99", href: "/envios" },
    { tipo: "enlace", etiqueta: "Mayorista", href: "/mayorista" },
    {
      tipo: "desplegable",
      etiqueta: "Ayuda",
      items: [
        { etiqueta: "Cambios y devoluciones", href: "/ayuda/cambios-y-devoluciones" },
        { etiqueta: "Preguntas frecuentes", href: "/ayuda/preguntas-frecuentes" },
        { etiqueta: "Contacto", href: "/ayuda/contacto" },
      ],
    },
  ];

  return (
    <>
      <Cabecera secciones={secciones} />
      {children}
    </>
  );
}
