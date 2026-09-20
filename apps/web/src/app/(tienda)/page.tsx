import {
  BannerOferta,
  BannerPromo,
  CabeceraSeccion,
  Carrusel,
  Contenedor,
  Hero,
  TarjetaProducto,
  TarjetaMarca,
  type DiapositivaHero,
} from "@appweb/ui";

import { productosEnOferta, productosNuevos, marcas } from "@/lib/consultas";
import "./portada.css";

/** CLASE A — portada. Etiqueta `portada`. Presupuesto: 20-40 ms. */

// Contenido de marketing, no de negocio: no calcula precio ni stock, asi que
// no va en @appweb/core. Los CTA de ofertas y novedades apuntan a las anclas
// de sus propias secciones mas abajo en esta misma pagina.
const diapositivasHero: DiapositivaHero[] = [
  {
    imagenUrl: "/producto.webp",
    titulo: "Nueva Temporada",
    subtitulo: "Básicos que se sienten tan bien como se ven.",
    textoCta: "Ver colección",
    hrefCta: "/categorias/hombres",
  },
  {
    imagenUrl: "/producto.webp",
    titulo: "Hasta 30% de descuento",
    subtitulo: "En una selección de básicos para toda la familia.",
    textoCta: "Ver ofertas",
    hrefCta: "#ofertas",
  },
  {
    imagenUrl: "/producto.webp",
    titulo: "Recién Llegados",
    subtitulo: "Descubre los últimos ingresos de la temporada.",
    textoCta: "Ver novedades",
    hrefCta: "#nuevos-ingresos",
  },
];

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

        <section className="portada__seccion">
          <Hero
            diapositivas={diapositivasHero}
            panelLateral={
              <>
                <BannerPromo
                  titulo="Envío gratis"
                  texto="En compras desde S/ 99 en Lima y Callao"
                  imagenUrl="/producto.webp"
                />
                <BannerPromo
                  titulo="Packs familiares"
                  texto="Ahorra comprando en pack x3 o más"
                  imagenUrl="/producto.webp"
                />
              </>
            }
          />
        </section>

        {lasMarcas.length > 0 ? (
          <section className="portada__seccion">
            <Carrusel etiqueta="Marcas">
              {lasMarcas.map((marca) => (
                <TarjetaMarca key={marca.slug} {...marca} />
              ))}
            </Carrusel>
          </section>
        ) : null}

        {ofertas.length > 0 ? (
          <section id="ofertas" className="portada__seccion">
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
          <section id="nuevos-ingresos" className="portada__seccion">
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
