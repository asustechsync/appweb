import type { Metadata } from "next";

import { PaginaInformativa } from "@appweb/ui";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | SOCKS",
  description: "Respuestas sobre pago, envío, tallas y devoluciones.",
};

export default function PaginaPreguntasFrecuentes() {
  return (
    <PaginaInformativa titulo="Preguntas frecuentes">
      <h2>¿Cómo pago mi pedido?</h2>
      <p>Aceptamos Yape, Plin y transferencia bancaria. Pagas al confirmar tu pedido.</p>

      <h2>¿Cuánto demora el envío?</h2>
      <p>
        1 – 3 días hábiles en Lima y Callao, 3 – 7 días hábiles en el resto del país. Más
        detalles en <a href="/envios">Envíos</a>.
      </p>

      <h2>No sé qué talla pedir, ¿qué hago?</h2>
      <p>
        Revisa nuestra <a href="/guia-tallas">Guía de Tallas</a> antes de comprar. Si tu
        medida está entre dos tallas, te recomendamos elegir la mayor.
      </p>

      <h2>¿Puedo cambiar un producto si no me queda?</h2>
      <p>
        Sí, dentro de los 7 días de recibido y sin usar. Todos los detalles en{" "}
        <a href="/ayuda/cambios-y-devoluciones">Cambios y devoluciones</a>.
      </p>

      <h2>¿Venden al por mayor?</h2>
      <p>
        Sí, para colegios, empresas y revendedores. Revisa{" "}
        <a href="/mayorista">Ventas al por mayor</a>.
      </p>

      <p>¿No encontraste tu respuesta? Escríbenos por <a href="/ayuda/contacto">contacto</a>.</p>
    </PaginaInformativa>
  );
}
