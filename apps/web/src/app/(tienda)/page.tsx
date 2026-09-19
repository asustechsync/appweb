import { CarruselProductos, Contenedor, TarjetaProducto } from "@appweb/ui";

import { productosEnOferta } from "@/lib/consultas";

/** CLASE A — portada. Etiqueta `portada`. Presupuesto: 20-40 ms. */

export default async function PaginaPortada() {
  const ofertas = await productosEnOferta();

  return (
    <main>
      <Contenedor>
        <h1>Tienda</h1>

        {ofertas.length > 0 ? (
          <section>
            <h2>Ofertas</h2>
            <CarruselProductos etiqueta="Ofertas">
              {ofertas.map((producto) => (
                <TarjetaProducto key={producto.slug} {...producto} />
              ))}
            </CarruselProductos>
          </section>
        ) : null}
      </Contenedor>
    </main>
  );
}
