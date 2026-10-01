import { Contenedor } from "@appweb/ui";

import { metodosDeEnvio } from "@/lib/consultas";
import { ETIQUETAS_MEDIO, pasarela } from "@/lib/pago";

import { CheckoutCliente } from "./CheckoutCliente";

/**
 * CLASE B — checkout. Shell en 40 ms; los datos no se cachean nunca.
 *
 * Igual que el carrito: esta pagina solo trae lo que es igual para cualquier
 * visitante (metodos de envio, medios de pago activos, los dos cacheados o
 * derivados de configuracion). Quien es el comprador, sus direcciones y las
 * lineas de su carrito llegan despues, dentro de la isla cliente.
 *
 * El paso de facturacion pide tipo de comprobante, RUC/DNI y razon social
 * DESDE AHORA, aunque la emision llegue despues. Si no se piden desde el
 * inicio, luego hay que perseguir a los clientes por datos que ya no estan.
 *
 * El cobro pasa por el puerto `PasarelaPago`:
 *   hoy     -> PagoManual (Yape, Plin, transferencia)
 *   despues -> la pasarela real, sin tocar esta pagina.
 */

export const metadata = { title: "Finalizar compra" };

export default async function PaginaCheckout() {
  const metodos = await metodosDeEnvio();

  const mediosDePago = pasarela.mediosSoportados
    .filter((valor): valor is keyof typeof ETIQUETAS_MEDIO => valor in ETIQUETAS_MEDIO)
    .map((valor) => ({ valor, ...ETIQUETAS_MEDIO[valor]! }));

  return (
    <main>
      <Contenedor>
        <CheckoutCliente metodos={metodos} mediosDePago={mediosDePago} />
      </Contenedor>
    </main>
  );
}
