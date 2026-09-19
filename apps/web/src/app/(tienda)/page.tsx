import { BannerOferta, CabeceraSeccion, CarruselProductos, Contenedor, TarjetaProducto } from "@appweb/ui";

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
            {/* Sin hrefVerTodo: no existe /ofertas todavia, no apuntamos a
                una ruta que da 404. */}
            <CabeceraSeccion titulo="Ofertas" />
            <CarruselProductos
              etiqueta="Ofertas"
              fijo={<BannerOferta titulo="Ofertas de temporada" texto="Hasta 30% de descuento" />}
            >
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
