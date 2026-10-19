import type { Metadata } from "next";
import Link from "next/link";

import { datosTienda } from "@appweb/api/tienda";
import { PaginaInformativa } from "@appweb/ui";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos y protegemos tus datos personales.",
};

/** Fecha de la ultima revision del texto. Cambiarla cada vez que cambie la politica. */
const ACTUALIZADO = "19 de octubre de 2026";

export default function PaginaPrivacidad() {
  const tienda = datosTienda();
  return (
    <PaginaInformativa titulo="Política de privacidad">
      <p>Última actualización: {ACTUALIZADO}.</p>
      <p>
        Esta política explica qué datos personales recogemos, para qué los usamos y cómo puedes
        ejercer tus derechos, conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y
        su reglamento.
      </p>

      <h2>1. Responsable</h2>
      <p>
        El responsable del tratamiento es <strong>{tienda.razonSocial}</strong>, con RUC{" "}
        {tienda.ruc} y domicilio en {tienda.direccion}. Para cualquier consulta sobre tus datos,
        escríbenos a <a href={`mailto:${tienda.correo}`}>{tienda.correo}</a>.
      </p>

      <h2>2. Qué datos recogemos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> correo, contraseña (guardada cifrada, nadie puede leerla), nombre
          y teléfono.
        </li>
        <li>
          <strong>Perfil (opcional):</strong> apellidos, fecha de nacimiento, género y documento de
          identidad.
        </li>
        <li>
          <strong>Compras:</strong> direcciones de envío, productos comprados, medio de pago, número
          de operación y datos para la boleta o factura (DNI o RUC y razón social).
        </li>
        <li>
          <strong>Reclamos:</strong> los datos que registras en el Libro de Reclamaciones.
        </li>
      </ul>
      <p>
        No guardamos datos de tarjetas: los pagos con Yape, Plin o transferencia se hacen fuera de
        la tienda.
      </p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Crear y administrar tu cuenta.</li>
        <li>Procesar tus pedidos, verificar los pagos y entregar los productos.</li>
        <li>Emitir los comprobantes de pago.</li>
        <li>Avisarte por correo o WhatsApp sobre el estado de tus pedidos.</li>
        <li>Atender tus consultas, cambios y reclamos.</li>
        <li>Cumplir obligaciones legales, tributarias y de protección al consumidor.</li>
      </ul>
      <p>
        No usamos tus datos para publicidad ni los vendemos. Si algún día queremos enviarte
        promociones, te pediremos tu consentimiento por separado.
      </p>

      <h2>4. Con quién los compartimos</h2>
      <p>Solo con quienes nos ayudan a operar la tienda, y solo lo necesario para cada tarea:</p>
      <ul>
        <li>El proveedor de servidores y base de datos donde se aloja la tienda.</li>
        <li>El proveedor de envío de correos.</li>
        <li>
          La empresa de transporte o courier que entrega tu pedido (nombre, teléfono, dirección).
        </li>
        <li>Autoridades, cuando una ley o una orden lo exija.</li>
      </ul>
      <p>
        Algunos de estos proveedores tienen sus servidores fuera del Perú, por lo que tus datos
        pueden almacenarse en el extranjero, siempre con medidas de seguridad adecuadas.
      </p>

      <h2>5. Cuánto tiempo los guardamos</h2>
      <p>
        Mientras tengas tu cuenta activa. Los datos de pedidos y comprobantes se conservan por el
        plazo que exigen las normas tributarias, y las hojas del Libro de Reclamaciones, por lo
        menos dos años.
      </p>

      <h2>6. Cookies y almacenamiento del navegador</h2>
      <p>
        Usamos una cookie propia para mantener tu sesión iniciada, y el almacenamiento de tu
        navegador para recordar tu carrito y el tema claro u oscuro. No usamos cookies de publicidad
        ni de terceros.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes pedir en cualquier momento acceder a tus datos, rectificarlos, cancelarlos u oponerte
        a su tratamiento, así como revocar tu consentimiento. Escríbenos a{" "}
        <a href={`mailto:${tienda.correo}`}>{tienda.correo}</a> desde el correo de tu cuenta,
        indicando qué derecho quieres ejercer. Responderemos en los plazos que establece la ley.
      </p>
      <p>
        Si consideras que no atendimos tu pedido, puedes acudir a la Autoridad Nacional de
        Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Las contraseñas se guardan cifradas, la conexión con la tienda es segura (HTTPS) y solo el
        personal que lo necesita para su trabajo accede a los datos de los pedidos.
      </p>

      <h2>9. Cambios</h2>
      <p>
        Si cambiamos esta política, publicaremos la nueva versión aquí. Lee también nuestros{" "}
        <Link href="/terminos">Términos y condiciones</Link>.
      </p>
    </PaginaInformativa>
  );
}
