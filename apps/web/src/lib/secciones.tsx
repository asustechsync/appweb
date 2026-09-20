import {
  IconoEtiqueta,
  IconoMarca,
  IconoPregunta,
  IconoTicket,
  type SeccionDeNavegacion,
} from "@appweb/ui";

/**
 * Secciones de la barra de la cabecera.
 *
 * Vive fuera de los layouts porque la cabecera sale en los dos grupos de
 * rutas — (tienda) y (compra) — y dos copias de esta lista se separarian al
 * primer cambio.
 *
 * "Cupones" es `visual`: todavia no hay tabla de cupones ni canje en el
 * checkout, asi que no apunta a ningun lado hasta que exista.
 *
 * Los `/#...` en vez de `#...` son a proposito: esas anclas solo existen en la
 * portada y la cabecera se renderiza en todas las paginas.
 */
export const SECCIONES: SeccionDeNavegacion[] = [
  {
    tipo: "enlace",
    etiqueta: "Ofertas",
    href: "/#ofertas",
    icono: <IconoEtiqueta tamano={16} />,
  },
  { tipo: "visual", etiqueta: "Cupones", icono: <IconoTicket tamano={16} /> },
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
];
