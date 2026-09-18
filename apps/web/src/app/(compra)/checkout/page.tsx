/**
 * CLASE B — checkout. Shell en 40 ms; los datos no se cachean nunca.
 *
 * Pasos: direccion -> envio -> facturacion -> pago.
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

export default function PaginaCheckout() {
  return (
    <main>
      <h1>Finalizar compra</h1>
    </main>
  );
}
