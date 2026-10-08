import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";

import { IconoEtiqueta, IconoMoneda, IconoPedidos, IconoSoporte, IconoUbicacion, type PropsIcono } from "../iconos";
import type { PropsBloqueColeccion } from "./BloqueColeccion";
import { Beneficio, type PropsBeneficio } from "./Beneficio";
import { Carrusel } from "./Carrusel";
import { CarruselPortada } from "./CarruselPortada";
import { Precio } from "./Precio";
import { TarjetaProducto, type PropsTarjetaProducto } from "./TarjetaProducto";

import "./estilos/escaparate-portada.css";

export interface PropsEscaparatePortada {
  titulo: string;
  subtitulo: string;
  productos: PropsTarjetaProducto[];
  /** Hasta 10 productos recien llegados; mismo carrusel que ofertas, debajo de este. */
  ingresos: PropsTarjetaProducto[];
  coleccion: PropsBloqueColeccion;
}

interface AtajoCompra {
  Icono: ComponentType<PropsIcono>;
  titulo: string;
  href: string;
}

const atajos: AtajoCompra[] = [
  { Icono: IconoEtiqueta, titulo: "Guía de tallas", href: "/guia-tallas" },
  { Icono: IconoUbicacion, titulo: "Envíos", href: "/envios" },
  { Icono: IconoMoneda, titulo: "Medios de pago", href: "/ayuda/preguntas-frecuentes" },
  { Icono: IconoPedidos, titulo: "Cambios y devoluciones", href: "/ayuda/cambios-y-devoluciones" },
  { Icono: IconoSoporte, titulo: "Contacto", href: "/ayuda/contacto" },
];

/**
 * Accesos de la escena por tipo de prenda. La cabecera ya filtra por quien lo
 * usa (categorias); aqui se filtra por que es. Mientras no exista un listado
 * por tipo, van a la busqueda.
 */
const segmentos = [
  { titulo: "Boxers", href: "/buscar?q=boxer" },
  { titulo: "Medias", href: "/buscar?q=medias" },
  { titulo: "Accesorios", href: "/buscar?q=accesorios" },
] as const;

/** Tira de categorias, como el pronostico por horas de un panel. */
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

const promocionesPortada = [
  {
    etiqueta: "Ofertas por tiempo limitado",
    titulo: "Tus básicos favoritos, a mejor precio",
    detalle: "Encuentra prendas seleccionadas desde S/ 11.90.",
    href: "/#ofertas",
    accion: "Ver ofertas",
    estilo: "ofertas",
  },
  {
    etiqueta: "Envíos a todo el Perú",
    titulo: "Envío gratis desde S/ 99",
    detalle: "Arma tu pedido y recibe tus básicos donde estés.",
    href: "/envios",
    accion: "Conocer envíos",
    estilo: "envios",
  },
  {
    etiqueta: "Compra fácil y segura",
    titulo: "Paga con Yape, Plin o transferencia",
    detalle: "Elige tu medio de pago al finalizar tu compra.",
    href: "/ayuda/preguntas-frecuentes",
    accion: "Ver medios de pago",
    estilo: "pagos",
  },
] as const;

/**
 * Portada en panel de control. Arriba, sobre un cielo: riel de atajos, escena
 * con el producto destacado y sus lecturas flotando en vidrio, y a la derecha
 * la presentación. Debajo, una fila de cuatro tarjetas: categorías, guía de
 * tallas, lo nuevo y confianza; luego banners y nuevos ingresos.
 */
export function EscaparatePortada({ titulo, subtitulo, productos, ingresos, coleccion }: PropsEscaparatePortada) {
  const nuevos = productos.slice(0, 3);

  return (
    <main className="ui-escaparate">
      <div className="ui-escaparate__panel">
        <section className="ui-escaparate__presentacion" aria-labelledby="escaparate-titulo">
          <div className="ui-escaparate__presentacion-cabecera">
            <div className="ui-escaparate__presentacion-textos">
              <h1 id="escaparate-titulo" className="ui-escaparate__titulo">{titulo}</h1>
              <p className="ui-escaparate__subtitulo">{subtitulo}</p>
            </div>
            <span className="ui-escaparate__insignia">{coleccion.etiqueta}</span>
          </div>

          <div className="ui-escaparate__presentacion-pie">
            <div className="ui-escaparate__coleccion-texto">
              <strong>{coleccion.titulo}</strong>
              <span>{coleccion.texto}</span>
              <Link className="ui-escaparate__boton" href={coleccion.href}>
                Ver colección <span aria-hidden="true">↗</span>
              </Link>
            </div>
            {coleccion.imagen ? (
              <Image
                className="ui-escaparate__coleccion-imagen"
                src={coleccion.imagen}
                alt={coleccion.altImagen ?? coleccion.titulo}
                width={480}
                height={360}
                sizes="(min-width: 64rem) 30vw, 60vw"
                unoptimized
              />
            ) : null}
          </div>
        </section>

        <section className="ui-escaparate__escena" aria-label="Producto destacado">
          <nav className="ui-escaparate__riel" aria-label="Atajos de ayuda">
            {atajos.map(({ Icono, titulo: tituloAtajo, href }) => (
              <Link key={href} className="ui-escaparate__riel-boton" href={href} title={tituloAtajo}>
                <Icono tamano={20} />
                <span className="ui-escaparate__riel-texto">{tituloAtajo}</span>
              </Link>
            ))}
          </nav>
          <div className="ui-escaparate__zona">
            <div className="ui-escaparate__escena-cabecera">
              <span className="ui-escaparate__selector">
                Destacados <span className="ui-escaparate__selector-cifra">{productos.length}</span>
              </span>
              <nav className="ui-escaparate__segmentos" aria-label="Tipos de prenda">
                {segmentos.map((segmento) => (
                  <Link key={segmento.href} className="ui-escaparate__segmento" href={segmento.href}>
                    {segmento.titulo}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="ui-escaparate__producto">
              <CarruselPortada productos={productos} />
            </div>
          </div>
        </section>

        <section className="ui-escaparate__categorias" aria-labelledby="escaparate-categorias">
          <div className="ui-escaparate__tarjeta-cabecera">
            <h2 id="escaparate-categorias" className="ui-escaparate__tarjeta-titulo">Compra por categoría</h2>
          </div>
          <ul className="ui-escaparate__tira">
            {categorias.map((categoria) => (
              <li key={categoria.href}>
                <Link className="ui-escaparate__tira-item" href={categoria.href}>
                  <strong>{categoria.titulo}</strong>
                  <span>{categoria.detalle}</span>
                  <span className="ui-escaparate__tira-flecha" aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
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

        {/* Nuevos ingresos: carrusel con las clases ofertas-* (el diseno nacio para
            la seccion Ofertas); todos llevan la etiqueta Nuevo. */}
        {ingresos.length > 0 ? (
          <>
            <section className="ui-escaparate__promociones" aria-label="Promociones de la tienda">
              {promocionesPortada.map((promocion) => (
                <article
                  key={promocion.estilo}
                  className={`ui-escaparate__promocion ui-escaparate__promocion--${promocion.estilo}`}
                >
                  <p className="ui-escaparate__promocion-etiqueta">{promocion.etiqueta}</p>
                  <h2 className="ui-escaparate__promocion-titulo">{promocion.titulo}</h2>
                  <p className="ui-escaparate__promocion-detalle">{promocion.detalle}</p>
                  <Link className="ui-escaparate__promocion-enlace" href={promocion.href}>
                    {promocion.accion} <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              ))}
            </section>
            <section className="ui-escaparate__ofertas ui-escaparate__ingresos" aria-labelledby="escaparate-ingresos">
            <div className="ui-escaparate__ofertas-titulo">
              <h2 id="escaparate-ingresos" className="ui-escaparate__tarjeta-titulo">Nuevos ingresos</h2>
            </div>
            <div className="ui-escaparate__ofertas-carrusel">
              <Carrusel etiqueta="Nuevos ingresos" infinito>
                {ingresos.map((producto) => (
                  <TarjetaProducto key={producto.slug} {...producto} etiqueta="Nuevo" contexto="carrusel" />
                ))}
              </Carrusel>
            </div>
            </section>
          </>
        ) : null}

        {nuevos.length > 0 ? (
          <section className="ui-escaparate__nuevos" aria-labelledby="escaparate-nuevos">
            <div className="ui-escaparate__tarjeta-cabecera">
              <h2 id="escaparate-nuevos" className="ui-escaparate__tarjeta-titulo">Lo nuevo</h2>
              <span className="ui-escaparate__contador">{nuevos.length} productos</span>
            </div>
            <ul className="ui-escaparate__lista">
              {nuevos.map((producto) => (
                <li key={producto.slug}>
                  <Link className="ui-escaparate__fila" href={`/productos/${producto.slug}`}>
                    <span className="ui-escaparate__miniatura">
                      {producto.imagenUrl ? (
                        <Image src={producto.imagenUrl} alt="" width={56} height={56} sizes="56px" />
                      ) : null}
                    </span>
                    <span className="ui-escaparate__fila-texto">
                      <strong>{producto.nombre}</strong>
                      <span>{producto.disponible ? producto.categoria ?? "Disponible" : "Agotado"}</span>
                    </span>
                    <Precio valor={producto.precio} antes={producto.precioLista ?? null} tamano="sm" />
                  </Link>
                </li>
              ))}
            </ul>
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
