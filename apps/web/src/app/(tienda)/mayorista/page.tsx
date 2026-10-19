import type { Metadata } from "next";

import { datosTienda } from "@appweb/api/tienda";
import { EnlaceDestacado, PaginaInformativa } from "@appweb/ui";

import { whatsappMayorista } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Ventas al por mayor",
  description: "Dotación para empresas, colegios y revendedores en volumen.",
};

export default function PaginaMayorista() {
  const whatsapp = whatsappMayorista();
  const { correo } = datosTienda();
  return (
    <PaginaInformativa titulo="Ventas al por mayor">
      <p>
        Si necesitas boxers, calzones, medias o accesorios en volumen —para tu colegio, empresa o
        negocio de reventa— tenemos precios especiales por cantidad.
      </p>

      <h2>¿Para quién es?</h2>
      <ul>
        <li>Colegios e institutos: uniformes y dotación escolar.</li>
        <li>Empresas: dotación para el personal.</li>
        <li>Revendedores: compra en volumen con precio preferencial.</li>
      </ul>

      <h2>¿Cómo funciona?</h2>
      <p>
        Escríbenos con la cantidad y los productos que necesitas. Te respondemos con precio, tiempo
        de entrega y forma de pago para tu pedido.
      </p>

      {whatsapp ? (
        <EnlaceDestacado href={whatsapp} externo>
          Cotizar por WhatsApp
        </EnlaceDestacado>
      ) : (
        <p>
          Escríbenos a <a href={`mailto:${correo}`}>{correo}</a>.
        </p>
      )}
    </PaginaInformativa>
  );
}
