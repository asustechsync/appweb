import type { Metadata } from "next";

import { PaginaInformativa } from "@appweb/ui";

export const metadata: Metadata = {
  title: "Envíos | SOCKS",
  description: "Costos y tiempos de envío a Lima, Callao y el resto del Perú.",
};

export default function PaginaEnvios() {
  return (
    <PaginaInformativa titulo="Envíos">
      <p>
        <strong>Envío gratis</strong> en compras desde S/ 99 en Lima y Callao. Por debajo de
        ese monto, el costo se calcula en el checkout según tu dirección.
      </p>

      <h2>Tiempos de entrega</h2>
      <ul>
        <li>Lima y Callao: 1 – 3 días hábiles.</li>
        <li>Resto del país: 3 – 7 días hábiles, según la agencia de transporte.</li>
      </ul>

      <h2>Seguimiento</h2>
      <p>
        Una vez despachado tu pedido, te avisamos con el código de seguimiento al correo o
        número que registraste en la compra.
      </p>

      <p>
        ¿Tu pedido no llegó en el plazo esperado?{" "}
        <a href="/ayuda/contacto">Escríbenos</a> con tu número de pedido.
      </p>
    </PaginaInformativa>
  );
}
