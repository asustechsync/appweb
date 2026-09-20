import { Contenedor } from "@appweb/ui";

import { metodosDeEnvio } from "@/lib/consultas";

import { CarritoCliente } from "./CarritoCliente";

/**
 * CLASE B — carrito. Shell estatico + isla cliente con las lineas.
 *
 * Lo que no depende del comprador —cabecera, contenedor, metodos de envio—
 * se pre-renderiza; las lineas llegan despues, cuando la isla lee el carrito
 * del navegador y pide al servidor precio y stock frescos.
 *
 * Los totales NO se calculan aqui: salen de `calcularTotales` de @appweb/core,
 * la misma funcion que cierra el pedido en el servidor.
 */

export const metadata = { title: "Carrito" };

export default async function PaginaCarrito() {
  const metodos = await metodosDeEnvio();

  return (
    <main>
      <Contenedor>
        <CarritoCliente metodos={metodos} />
      </Contenedor>
    </main>
  );
}
