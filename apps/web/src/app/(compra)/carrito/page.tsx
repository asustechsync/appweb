import { Contenedor } from "@appweb/ui";

import { CarritoCliente } from "./CarritoCliente";

/**
 * CLASE B — carrito. Shell estatico + isla cliente con las lineas.
 *
 * Lo que no depende del comprador —cabecera y contenedor— se pre-renderiza; las lineas llegan despues, cuando la isla lee el carrito
 * del navegador y pide al servidor precio y stock frescos.
 *
 * Los totales NO se calculan aqui: salen de `calcularTotales` de @appweb/core,
 * la misma funcion que cierra el pedido en el servidor.
 */

export const metadata = { title: "Carrito" };

export default function PaginaCarrito() {
  return (
    <main>
      <Contenedor>
        <CarritoCliente />
      </Contenedor>
    </main>
  );
}
