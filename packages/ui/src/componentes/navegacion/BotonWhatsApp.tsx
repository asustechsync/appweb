import { IconoWhatsApp } from "../../iconos";

import "./boton-whatsapp.css";

export interface PropsBotonWhatsApp {
  /** Enlace wa.me ya armado con `enlaceWhatsApp` de @appweb/core. */
  href: string;
  etiqueta?: string;
}

/**
 * Boton flotante para escribir a la tienda por WhatsApp. Abajo a la derecha,
 * en una pestaña nueva (en el celular abre la app directamente).
 *
 * No va en paginas con barra fija al pie (ficha, carrito, checkout): ahi la
 * taparia. Eso lo decide quien lo usa, no este componente.
 */
export function BotonWhatsApp({ href, etiqueta = "Escríbenos por WhatsApp" }: PropsBotonWhatsApp) {
  return (
    <a
      className="ui-boton-whatsapp"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={etiqueta}
      title={etiqueta}
    >
      <IconoWhatsApp tamano={28} />
    </a>
  );
}
