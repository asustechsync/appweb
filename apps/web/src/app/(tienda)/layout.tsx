import { Cabecera, IconoEtiqueta, IconoPregunta, type SeccionDeNavegacion } from "@appweb/ui";

/**
 * Layout de la tienda publica — CLASE A.
 *
 * La cabecera es casi toda HTML estatico: solo SelectorUbicacion, AlternarTema
 * y el item "desplegable" (Ayuda) son islas cliente.
 *
 * Las secciones de la barra combinan datos reales (ancla de Marcas y de
 * Ofertas en la portada) con paginas de contenido estatico (Envios, Ayuda/*).
 *
 * Los `/#...` en vez de `#...` son a proposito: esas anclas solo existen en
 * la portada, y la cabecera se renderiza en todas las paginas.
 */
export default function LayoutTienda({ children }: { children: React.ReactNode }) {
  const secciones: SeccionDeNavegacion[] = [
    {
      tipo: "enlace",
      etiqueta: "Ofertas",
      href: "/#ofertas",
      icono: <IconoEtiqueta tamano={14} />,
    },
    { tipo: "enlace", etiqueta: "Marcas", href: "/#marcas" },
    {
      tipo: "desplegable",
      etiqueta: "Ayuda",
      icono: <IconoPregunta tamano={14} />,
      items: [
        { etiqueta: "Cambios y devoluciones", href: "/ayuda/cambios-y-devoluciones" },
        { etiqueta: "Preguntas frecuentes", href: "/ayuda/preguntas-frecuentes" },
        { etiqueta: "Contacto", href: "/ayuda/contacto" },
      ],
    },
    { tipo: "enlace", etiqueta: "Envío GRATIS desde S/99", href: "/envios" },
  ];

  return (
    <>
      <Cabecera secciones={secciones} />
      {children}
    </>
  );
}
