import type { Metadata } from "next";
import Link from "next/link";

import { datosTienda } from "@appweb/api/tienda";
import { PaginaInformativa } from "@appweb/ui";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso de la tienda y de compra de nuestros productos.",
};

/** Fecha de la ultima revision del texto. Cambiarla cada vez que cambien las condiciones. */
const ACTUALIZADO = "19 de octubre de 2026";

export default function PaginaTerminos() {
  const tienda = datosTienda();
  return (
    <PaginaInformativa titulo="Términos y condiciones">
      <p>Última actualización: {ACTUALIZADO}.</p>
      <p>
        Estos términos regulan el uso de esta tienda virtual y las compras que hagas en ella. Al
        crear una cuenta o hacer un pedido, aceptas estas condiciones y nuestra{" "}
        <Link href="/privacidad">Política de privacidad</Link>.
      </p>

      <h2>1. Quiénes somos</h2>
      <p>
        La tienda es operada por <strong>{tienda.razonSocial}</strong>, con RUC {tienda.ruc} y
        domicilio en {tienda.direccion}. Puedes escribirnos a{" "}
        <a href={`mailto:${tienda.correo}`}>{tienda.correo}</a>.
      </p>

      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Para comprar necesitas una cuenta con datos verdaderos y actualizados.</li>
        <li>
          Eres responsable de mantener tu contraseña en reserva y de lo que se haga con tu cuenta.
        </li>
        <li>
          Si eres menor de edad, debes comprar con la autorización y supervisión de tu padre, madre
          o tutor.
        </li>
        <li>Podemos suspender cuentas usadas para fraude o para dañar a la tienda o a terceros.</li>
      </ul>

      <h2>3. Productos y precios</h2>
      <ul>
        <li>Los precios están en soles (S/) e incluyen el IGV.</li>
        <li>
          El costo de envío se muestra por separado en el checkout, antes de confirmar el pedido.
        </li>
        <li>
          Las fotos son referenciales: el color puede variar ligeramente según la pantalla. Las
          medidas de cada talla están en la <Link href="/guia-tallas">guía de tallas</Link>.
        </li>
        <li>El precio que pagas es el que figura al confirmar tu pedido, aunque después cambie.</li>
      </ul>

      <h2>4. Pedidos y pagos</h2>
      <ul>
        <li>
          Aceptamos Yape, Plin, transferencia bancaria y, donde esté disponible, pago contra
          entrega.
        </li>
        <li>
          Con Yape, Plin o transferencia, el pedido queda confirmado cuando verificamos el pago. Si
          el pago no llega, podemos cancelar el pedido.
        </li>
        <li>
          El stock se reserva al confirmar el pago. Si un producto se agotó antes, te avisamos y te
          devolvemos el importe pagado por él.
        </li>
        <li>
          Emitimos boleta o factura según lo que elijas en el checkout, con los datos que nos
          indiques.
        </li>
      </ul>

      <h2>5. Envíos</h2>
      <p>
        Los plazos y costos de envío están en <Link href="/envios">Envíos</Link>. El plazo empieza a
        correr desde que el pago está confirmado. Si el paquete no puede entregarse por datos
        incorrectos o por ausencia del destinatario, el reenvío puede tener un costo adicional.
      </p>

      <h2>6. Cambios, devoluciones y garantía</h2>
      <p>
        Las condiciones de cambio están en{" "}
        <Link href="/ayuda/cambios-y-devoluciones">Cambios y devoluciones</Link>. Además, todos
        nuestros productos tienen la garantía legal de idoneidad: si un producto llega con defecto o
        no corresponde con lo que compraste, tienes derecho a la reparación, reposición o devolución
        del precio pagado.
      </p>

      <h2>7. Promociones y cupones</h2>
      <p>
        Cada promoción indica su vigencia, condiciones y, cuando corresponde, el stock disponible.
        Los cupones no son canjeables por dinero ni acumulables, salvo que se indique lo contrario.
      </p>

      <h2>8. Contenido de la tienda</h2>
      <p>
        Las marcas, logos, fotos y textos de esta tienda pertenecen a {tienda.razonSocial} o a sus
        respectivos titulares, y no pueden usarse sin autorización.
      </p>

      <h2>9. Reclamos</h2>
      <p>
        Si algo no salió bien, escríbenos primero a{" "}
        <a href={`mailto:${tienda.correo}`}>{tienda.correo}</a> o por{" "}
        <Link href="/ayuda/contacto">contacto</Link>. También puedes registrar un reclamo o una
        queja en nuestro <Link href="/libro-de-reclamaciones">Libro de Reclamaciones</Link>.
      </p>

      <h2>10. Ley aplicable y cambios</h2>
      <p>
        Estos términos se rigen por las leyes del Perú, en especial el Código de Protección y
        Defensa del Consumidor (Ley N.° 29571). Podemos actualizarlos; la versión vigente es la
        publicada en esta página y los pedidos ya hechos se rigen por la versión vigente al momento
        de la compra.
      </p>
    </PaginaInformativa>
  );
}
