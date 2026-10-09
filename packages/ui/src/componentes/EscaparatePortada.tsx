import Link from "next/link";

import { Beneficio, type PropsBeneficio } from "./Beneficio";
import { Carrusel } from "./Carrusel";
import { CarruselBanners, type BannerDeslizable } from "./CarruselBanners";
import { TarjetaProducto, type PropsTarjetaProducto } from "./TarjetaProducto";

import "./estilos/escaparate-portada.css";

export interface PropsEscaparatePortada {
  titulo: string;
  subtitulo: string;
  productos: PropsTarjetaProducto[];
  /** Hasta 10 productos con descuento real, en un carrusel de tarjetas de oferta (4 visibles). */
  ofertas?: PropsTarjetaProducto[];
}

/** Categorias, como la lista de alertas de un panel. */
const categorias = [
  { titulo: "Hombres", detalle: "Boxers y medias", href: "/categorias/hombres" },
  { titulo: "Mujeres", detalle: "Calzones y medias", href: "/categorias/mujeres" },
  { titulo: "Jóvenes", detalle: "Tallas juveniles", href: "/categorias/jovenes" },
  { titulo: "Niños", detalle: "De 2 a 12 años", href: "/categorias/ninos" },
  { titulo: "Bebés", detalle: "Algodón suave", href: "/categorias/bebes" },
] as const;

/**
 * Resumen de la tabla de /guia-tallas (boxers adultos). Contenido estatico:
 * si cambia la guia, se cambia aqui tambien. La altura de cada barra la da el
 * CSS por posicion.
 */
const tallasCintura = [
  { talla: "S", cintura: "70–78" },
  { talla: "M", cintura: "79–87" },
  { talla: "L", cintura: "88–96" },
  { talla: "XL", cintura: "97–106" },
] as const;

const beneficios: PropsBeneficio[] = [
  { etiqueta: "Seguridad", titulo: "Protección", detalle: "En cada compra" },
  { etiqueta: "Envíos", titulo: "Nacionales", detalle: "A todo el Perú" },
  { etiqueta: "Garantía", titulo: "Respaldo", detalle: "En cada pedido" },
  { etiqueta: "Soporte", titulo: "Atención", detalle: "A tus consultas" },
];

/**
 * Fin de oferta provisional: aun no hay fecha por producto en la base. Pasa a
 * venir del producto (resuelta en packages/core) cuando exista ese dato.
 */
const FIN_OFERTA_PROVISIONAL = "2026-12-31T23:59:59-05:00";

/** Slide de la banda: solo promociones, sin productos. */
const bannersPortada: BannerDeslizable[] = [
  {
    etiqueta: "Ofertas por tiempo limitado",
    titulo: "Tus básicos favoritos, a mejor precio",
    detalle: "Prendas seleccionadas desde S/ 11.90.",
    href: "/#ofertas",
    accion: "Ver ofertas",
    tono: "oferta",
  },
  {
    etiqueta: "Envíos a todo el Perú",
    titulo: "Envío gratis desde S/ 99",
    detalle: "Arma tu pedido y recíbelo donde estés.",
    href: "/envios",
    accion: "Conocer envíos",
    tono: "nuevo",
  },
  {
    etiqueta: "Compra fácil y segura",
    titulo: "Paga con Yape, Plin o transferencia",
    detalle: "Elige tu medio de pago al finalizar la compra.",
    href: "/ayuda/preguntas-frecuentes",
    accion: "Ver medios de pago",
    tono: "disponible",
  },
];

/**
 * Portada en panel de control. Arriba, un solo slide donde se turnan tres
 * banners promocionales y que se funde con el fondo de la web. Montadas sobre su borde inferior, tres
 * tarjetas: guia de tallas (oscura), categorias y la coleccion (alta, baja
 * hasta la fila de confianza). Debajo, una fila de 4 ofertas y los beneficios.
 */
export function EscaparatePortada({ titulo, subtitulo, productos, ofertas = [] }: PropsEscaparatePortada) {
  // Prefiere un producto con descuento real; si no hay, el siguiente al de la banda.
  const destacado = productos.find((p) => p.descuentoPct) ?? productos[1] ?? productos[0];

  return (
    <main className="ui-escaparate">
      <div className="ui-escaparate__panel">
        <section className="ui-escaparate__banda" aria-labelledby="escaparate-titulo">
          <h1 id="escaparate-titulo" className="ui-solo-lectores">{titulo}</h1>
          <p className="ui-solo-lectores">{subtitulo}</p>
          <CarruselBanners banners={bannersPortada} etiqueta="Promociones de la tienda" />
        </section>

        <section className="ui-escaparate__tallas" aria-labelledby="escaparate-tallas">
          <div className="ui-escaparate__tarjeta-cabecera">
            <h2 id="escaparate-tallas" className="ui-escaparate__tarjeta-titulo">Guía de tallas</h2>
            <Link className="ui-escaparate__contador" href="/guia-tallas">Ver guía</Link>
          </div>
          <ul className="ui-escaparate__barras" aria-label="Cintura en centímetros por talla de boxer">
            {tallasCintura.map(({ talla, cintura }) => (
              <li key={talla} className="ui-escaparate__barra">
                <span className="ui-escaparate__barra-dato">{cintura} cm</span>
                <span className="ui-escaparate__barra-pista" aria-hidden="true">
                  <span className="ui-escaparate__barra-relleno" />
                </span>
                <strong className="ui-escaparate__barra-talla">{talla}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="ui-escaparate__categorias" aria-labelledby="escaparate-categorias">
          <h2 id="escaparate-categorias" className="ui-escaparate__tarjeta-titulo">Compra por categoría</h2>
          <ul className="ui-escaparate__lista">
            {categorias.map((categoria) => (
              <li key={categoria.href}>
                <Link className="ui-escaparate__fila" href={categoria.href}>
                  <span className="ui-escaparate__inicial" aria-hidden="true">{categoria.titulo.charAt(0)}</span>
                  <span className="ui-escaparate__fila-texto">
                    <span>{categoria.detalle}</span>
                    <strong>{categoria.titulo}</strong>
                  </span>
                  <span className="ui-escaparate__flecha" aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="ui-escaparate__coleccion" aria-labelledby="escaparate-coleccion">
          <div className="ui-escaparate__tarjeta-cabecera">
            <h2 id="escaparate-coleccion" className="ui-escaparate__tarjeta-titulo">Ofertas</h2>
            <Link className="ui-escaparate__enlace-suave" href="/buscar">Ver todo</Link>
          </div>
          {destacado ? <TarjetaProducto {...destacado} etiqueta="Nuevo" presentacion="oferta" terminaEn={FIN_OFERTA_PROVISIONAL} /> : null}
        </section>

        {ofertas.length > 0 ? (
          <section className="ui-escaparate__ofertas" aria-labelledby="escaparate-ofertas-flash">
            <h2 id="escaparate-ofertas-flash" className="ui-escaparate__capsula">Ofertas flash</h2>
            <Carrusel infinito etiqueta="Productos en oferta" clase="ui-escaparate__ofertas-carrusel">
              {ofertas.map((producto) => (
                <div key={producto.slug} className="ui-escaparate__oferta">
                  <TarjetaProducto {...producto} presentacion="oferta" terminaEn={FIN_OFERTA_PROVISIONAL} />
                </div>
              ))}
            </Carrusel>
          </section>
        ) : null}

        <section className="ui-escaparate__confianza" aria-label="Compra con confianza">
          <ul className="ui-escaparate__atributos" aria-label="Ventajas de compra">
            {beneficios.map(({ etiqueta, titulo, detalle }) => (
              <li key={titulo}>
                <Beneficio etiqueta={etiqueta} titulo={titulo} detalle={detalle} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
