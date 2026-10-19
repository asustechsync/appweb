import type { Metadata } from "next";

import { datosTienda } from "@appweb/api/tienda";
import { EnlaceDestacado, PaginaInformativa } from "@appweb/ui";

import { whatsappTienda } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Canales de atención al cliente.",
};

/** WhatsApp y correo salen de WHATSAPP_TIENDA y TIENDA_CORREO: los mismos de toda la tienda. */
export default function PaginaContacto() {
  const whatsapp = whatsappTienda();
  const { correo } = datosTienda();
  return (
    <PaginaInformativa titulo="Contacto">
      <p>Escríbenos por el canal que prefieras. Atendemos de lunes a sábado, 9am – 7pm.</p>

      {whatsapp ? (
        <EnlaceDestacado href={whatsapp} externo>
          Escribir por WhatsApp
        </EnlaceDestacado>
      ) : null}

      <h2>Correo</h2>
      <p>
        <a href={`mailto:${correo}`}>{correo}</a>
      </p>
    </PaginaInformativa>
  );
}
