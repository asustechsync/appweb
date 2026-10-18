import { Acordeon } from "@appweb/ui";

/**
 * Secciones plegables bajo la descripcion de la ficha.
 *
 * EJEMPLO: textos fijos para ver la forma. Tallas, envios y pagos deben salir
 * despues de sus datos reales (zonas de envio, puerto de pagos) en
 * @appweb/core, no escritos aqui.
 */
export function SeccionesFicha() {
  return (
    <Acordeon
      secciones={[
        {
          titulo: "Guía de tallas",
          contenido: (
            <table>
              <thead>
                <tr>
                  <th>Talla</th>
                  <th>Cintura</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>S</td>
                  <td>70 – 78 cm</td>
                </tr>
                <tr>
                  <td>M</td>
                  <td>79 – 87 cm</td>
                </tr>
                <tr>
                  <td>L</td>
                  <td>88 – 96 cm</td>
                </tr>
                <tr>
                  <td>XL</td>
                  <td>97 – 106 cm</td>
                </tr>
              </tbody>
            </table>
          ),
        },
        {
          titulo: "Envío y entrega",
          contenido: (
            <ul>
              <li>Lima Metropolitana: 1 a 2 días hábiles.</li>
              <li>Provincias: 3 a 5 días hábiles.</li>
              <li>Envío gratis en compras desde S/ 99.</li>
            </ul>
          ),
        },
        {
          titulo: "Formas de pago",
          contenido: (
            <p>
              Yape, Plin o transferencia bancaria. Te enviamos los datos al confirmar el pedido.
            </p>
          ),
        },
        {
          titulo: "Cambios y devoluciones",
          contenido: (
            <p>
              Por higiene, la ropa interior solo se cambia sin abrir y con su empaque original,
              dentro de los 7 días de recibida.
            </p>
          ),
        },
        {
          titulo: "Material y cuidado",
          contenido: (
            <ul>
              <li>Lavar a máquina en agua fría, con colores similares.</li>
              <li>No usar lejía ni secadora.</li>
              <li>Secar a la sombra.</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
