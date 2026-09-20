import {
  Cabecera,
  IconoEtiqueta,
  IconoMarca,
  IconoPregunta,
  IconoTicket,
  type SeccionDeNavegacion,
} from "@appweb/ui";

/**
 * Layout de la tienda publica — CLASE A.
 *
 * La cabecera es casi toda HTML estatico: solo SelectorUbicacion, AlternarTema
 * y el item "desplegable" (Ayuda) son islas cliente.
 *
 * Las secciones de la barra combinan datos reales (ancla de Marcas y de
 * Ofertas en la portada) con paginas de contenido estatico (Envios, Ayuda/*).
 * "Cupones" queda como `visual`: todavia no hay sistema de cupones (sin
 * tabla ni logica de canje en el checkout), asi que no apunta a ningun
 * lado hasta que exista de verdad.
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
      icono: <IconoEtiqueta tamano={16} />,
    },
    {
      tipo: "enlace",
      etiqueta: "Marcas",
      href: "/#marcas",
      icono: <IconoMarca tamano={16} />,
    },
    {
      tipo: "desplegable",
      etiqueta: "Ayuda",
      icono: <IconoPregunta tamano={16} />,
      items: [
        { etiqueta: "Cambios y devoluciones", href: "/ayuda/cambios-y-devoluciones" },
        { etiqueta: "Preguntas frecuentes", href: "/ayuda/preguntas-frecuentes" },
        { etiqueta: "Contacto", href: "/ayuda/contacto" },
      ],
    },
    { tipo: "enlace", etiqueta: "Envío GRATIS desde S/99", href: "/envios" },
    { tipo: "visual", etiqueta: "Cupones", icono: <IconoTicket tamano={16} /> },
  ];

  return (
    <>
      <Cabecera secciones={secciones} />
      {children}
    </>
  );
}
