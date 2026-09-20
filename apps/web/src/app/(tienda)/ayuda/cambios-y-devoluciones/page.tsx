import type { Metadata } from "next";

import { PaginaInformativa } from "@appweb/ui";

export const metadata: Metadata = {
  title: "Cambios y devoluciones | SOCKS",
  description: "Condiciones para cambiar o devolver un producto.",
};

export default function PaginaCambiosYDevoluciones() {
  return (
    <PaginaInformativa titulo="Cambios y devoluciones">
      <p>
        Por ser prendas de uso íntimo, los cambios y devoluciones aplican solo cuando el
        producto no ha sido usado y conserva su empaque y etiquetas originales.
      </p>

      <h2>Plazo</h2>
      <p>Tienes 7 días calendario desde que recibes tu pedido para solicitar el cambio.</p>

      <h2>¿Cuándo aplica?</h2>
      <ul>
        <li>El producto llegó con una talla o color distinto al pedido.</li>
        <li>El producto llegó con un defecto de fábrica.</li>
      </ul>

      <h2>¿Cuándo no aplica?</h2>
      <ul>
        <li>El producto ya fue usado o lavado.</li>
        <li>Faltan las etiquetas originales.</li>
      </ul>

      <p>
        Para iniciar un cambio, escríbenos por <a href="/ayuda/contacto">contacto</a> con tu
        número de pedido y una foto del producto.
      </p>
    </PaginaInformativa>
  );
}
