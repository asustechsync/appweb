import type { Metadata } from "next";

import { PaginaInformativa } from "@appweb/ui";

export const metadata: Metadata = {
  title: "Contacto | SOCKS",
  description: "Canales de atención al cliente.",
};

// TODO: reemplazar por el numero de WhatsApp y correo reales de atencion.
const WHATSAPP_ATENCION = "51900000000";
const CORREO_ATENCION = "contacto@socks.pe";

export default function PaginaContacto() {
  return (
    <PaginaInformativa titulo="Contacto">
      <p>Escríbenos por el canal que prefieras. Atendemos de lunes a sábado, 9am – 7pm.</p>

      <a
        className="ui-pagina-informativa__cta"
        href={`https://wa.me/${WHATSAPP_ATENCION}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Escribir por WhatsApp
      </a>

      <h2>Correo</h2>
      <p>
        <a href={`mailto:${CORREO_ATENCION}`}>{CORREO_ATENCION}</a>
      </p>
    </PaginaInformativa>
  );
}
