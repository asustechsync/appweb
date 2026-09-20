import type { Metadata } from "next";

import { PaginaInformativa } from "@appweb/ui";

export const metadata: Metadata = {
  title: "Ventas al por mayor | SOCKS",
  description: "Dotación para empresas, colegios y revendedores en volumen.",
};

// TODO: reemplazar por el numero de WhatsApp real de ventas mayoristas.
const WHATSAPP_MAYORISTA = "51900000000";

export default function PaginaMayorista() {
  return (
    <PaginaInformativa titulo="Ventas al por mayor">
      <p>
        Si necesitas boxers, calzones, medias o accesorios en volumen —para tu colegio,
        empresa o negocio de reventa— tenemos precios especiales por cantidad.
      </p>

      <h2>¿Para quién es?</h2>
      <ul>
        <li>Colegios e institutos: uniformes y dotación escolar.</li>
        <li>Empresas: dotación para el personal.</li>
        <li>Revendedores: compra en volumen con precio preferencial.</li>
      </ul>

      <h2>¿Cómo funciona?</h2>
      <p>
        Escríbenos con la cantidad y los productos que necesitas. Te respondemos con precio,
        tiempo de entrega y forma de pago para tu pedido.
      </p>

      <a
        className="ui-pagina-informativa__cta"
        href={`https://wa.me/${WHATSAPP_MAYORISTA}?text=${encodeURIComponent(
          "Hola, quisiera cotizar una compra al por mayor.",
        )}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Cotizar por WhatsApp
      </a>
    </PaginaInformativa>
  );
}
