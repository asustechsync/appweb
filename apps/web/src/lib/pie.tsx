import { datosTienda } from "@appweb/api/tienda";
import { PiePagina, type GrupoDePie } from "@appweb/ui";

/**
 * Enlaces del pie. Los legales (terminos, privacidad y el Libro de
 * Reclamaciones) tienen que estar a un clic desde cualquier pagina publica.
 */
const GRUPOS: GrupoDePie[] = [
  {
    titulo: "Ayuda",
    enlaces: [
      { etiqueta: "Envíos", href: "/envios" },
      { etiqueta: "Cambios y devoluciones", href: "/ayuda/cambios-y-devoluciones" },
      { etiqueta: "Guía de tallas", href: "/guia-tallas" },
      { etiqueta: "Preguntas frecuentes", href: "/ayuda/preguntas-frecuentes" },
      { etiqueta: "Contacto", href: "/ayuda/contacto" },
    ],
  },
  {
    titulo: "Legal",
    enlaces: [
      { etiqueta: "Términos y condiciones", href: "/terminos" },
      { etiqueta: "Política de privacidad", href: "/privacidad" },
      { etiqueta: "Libro de Reclamaciones", href: "/libro-de-reclamaciones" },
    ],
  },
];

/**
 * Pie de la tienda con quien vende: sale del entorno, no de la base (Clase A).
 * Sin año en la leyenda: `new Date()` volveria dinamico el layout entero.
 */
export function PieTienda() {
  const tienda = datosTienda();
  return (
    <PiePagina
      grupos={GRUPOS}
      hrefLibro="/libro-de-reclamaciones"
      leyenda={`© ${tienda.nombre} · ${tienda.razonSocial} · RUC ${tienda.ruc}`}
    />
  );
}
