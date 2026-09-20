import { BannerOferta, CabeceraSeccion, CarruselProductos, Contenedor, TarjetaProducto } from "@appweb/ui";

import { productosEnOferta, productosNuevos } from "@/lib/consultas";
import "./portada.css";

/** CLASE A — portada. Etiqueta `portada`. Presupuesto: 20-40 ms. */

export default async function PaginaPortada() {
  const [ofertas, nuevos] = await Promise.all([
    productosEnOferta(),
    productosNuevos(),
  ]);

  return (
    <main>
      <Contenedor>
        {/* Oculto visualmente: sigue habiendo un h1 para SEO/accesibilidad,
            solo que no se muestra — era el placeholder que molestaba. */}
        <h1 className="ui-solo-lectores">Tienda</h1>

        {ofertas.length > 0 ? (
          <section className="portada__seccion">
            {/* Sin hrefVerTodo: no existe /ofertas todavia, no apuntamos a
                una ruta que da 404. */}
            <CabeceraSeccion titulo="Ofertas" />
            <CarruselProductos
              etiqueta="Ofertas"
              fijo={<BannerOferta titulo="Ofertas de temporada" texto="Hasta 30% de descuento" />}
            >
              {ofertas.map((producto) => (
                <TarjetaProducto key={producto.slug} {...producto} contexto="carrusel" />
              ))}
            </CarruselProductos>
          </section>
        ) : null}

        {nuevos.length > 0 ? (
          <section className="portada__seccion">
            <CabeceraSeccion titulo="Nuevos Ingresos" />
            <CarruselProductos etiqueta="Nuevos Ingresos">
              {nuevos.map((producto) => (
                <TarjetaProducto key={producto.slug} {...producto} contexto="carrusel" />
              ))}
            </CarruselProductos>
          </section>
        ) : null}
      </Contenedor>
    </main>
  );
}
