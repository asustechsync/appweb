import { BannerOferta, CabeceraSeccion, Carrusel, Contenedor, TarjetaProducto, TarjetaMarca } from "@appweb/ui";

import { productosEnOferta, productosNuevos, marcas } from "@/lib/consultas";
import "./portada.css";

/** CLASE A — portada. Etiqueta `portada`. Presupuesto: 20-40 ms. */

export default async function PaginaPortada() {
  const [ofertas, nuevos, lasMarcas] = await Promise.all([
    productosEnOferta(),
    productosNuevos(),
    marcas(),
  ]);

  return (
    <main>
      <Contenedor>
        {/* Oculto visualmente: sigue habiendo un h1 para SEO/accesibilidad,
            solo que no se muestra — era el placeholder que molestaba. */}
        <h1 className="ui-solo-lectores">Tienda</h1>

        {lasMarcas.length > 0 ? (
          <section className="portada__seccion">
            <CabeceraSeccion titulo="Marcas" />
            <Carrusel etiqueta="Marcas">
              {lasMarcas.map((marca) => (
                <TarjetaMarca key={marca.slug} {...marca} />
              ))}
            </Carrusel>
          </section>
        ) : null}

        {ofertas.length > 0 ? (
          <section className="portada__seccion">
            {/* Sin hrefVerTodo: no existe /ofertas todavia, no apuntamos a
                una ruta que da 404. */}
            <CabeceraSeccion titulo="Ofertas" />
            <Carrusel
              etiqueta="Ofertas"
              fijo={<BannerOferta titulo="Ofertas de temporada" texto="Hasta 30% de descuento" />}
            >
              {ofertas.map((producto) => (
                <TarjetaProducto key={producto.slug} {...producto} contexto="carrusel" />
              ))}
            </Carrusel>
          </section>
        ) : null}

        {nuevos.length > 0 ? (
          <section className="portada__seccion">
            <CabeceraSeccion titulo="Nuevos Ingresos" />
            <Carrusel etiqueta="Nuevos Ingresos">
              {nuevos.map((producto) => (
                <TarjetaProducto key={producto.slug} {...producto} contexto="carrusel" />
              ))}
            </Carrusel>
          </section>
        ) : null}
      </Contenedor>
    </main>
  );
}
