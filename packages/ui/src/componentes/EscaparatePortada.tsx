import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";

import { IconoEtiqueta, IconoMoneda, IconoPedidos, IconoSoporte, IconoUbicacion, type PropsIcono } from "../iconos";
import type { PropsBloqueColeccion } from "./BloqueColeccion";
import { Carrusel } from "./Carrusel";
import { CarruselPortada } from "./CarruselPortada";
import { Precio } from "./Precio";
import { TarjetaProducto, type PropsTarjetaProducto } from "./TarjetaProducto";

import "./estilos/escaparate-portada.css";

export interface PropsEscaparatePortada {
  titulo: string;
  subtitulo: string;
  productos: PropsTarjetaProducto[];
  /** Hasta 10 productos en oferta; el carrusel muestra 4 y el resto se desliza. */
  ofertas: PropsTarjetaProducto[];
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

const confianza = [
  { etiqueta: "Envíos", valor: "A todo el Perú", href: "/envios" },
  { etiqueta: "Pago", valor: "Yape, Plin y transferencia", href: "/ayuda/preguntas-frecuentes" },
  { etiqueta: "Atención", valor: "Te respondemos", href: "/ayuda/contacto" },
];

/**
 * Portada en panel. Izquierda: riel de atajos, producto protagonista y
 * franja de beneficios. Derecha: presentación grande con la colección, y
 * debajo lo nuevo y los datos de confianza.
 */
export function EscaparatePortada({ titulo, subtitulo, productos, ofertas, ingresos, coleccion }: PropsEscaparatePortada) {
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
          <div className="ui-escaparate__producto">
            <CarruselPortada productos={productos} />
          </div>
        </section>

        {ofertas.length > 0 ? (
          <section className="ui-escaparate__ofertas" aria-labelledby="escaparate-ofertas">
            <div className="ui-escaparate__ofertas-titulo">
              <h2 id="escaparate-ofertas" className="ui-escaparate__tarjeta-titulo">Ofertas</h2>
            </div>
            <div className="ui-escaparate__ofertas-carrusel">
              <Carrusel etiqueta="Productos en oferta" infinito>
                {ofertas.map((producto) => (
                  <TarjetaProducto key={producto.slug} {...producto} contexto="carrusel" />
                ))}
              </Carrusel>
            </div>
          </section>
        ) : null}

        {/* Nuevos ingresos: reutiliza el diseno de Ofertas (clases ofertas-*); solo cambia
            la posicion y que todos llevan la etiqueta Nuevo. */}
        {ingresos.length > 0 ? (
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

        <section className="ui-escaparate__confianza" aria-labelledby="escaparate-confianza">
          <h2 id="escaparate-confianza" className="ui-escaparate__tarjeta-titulo">Compra con confianza</h2>
          <dl className="ui-escaparate__datos">
            {confianza.map(({ etiqueta, valor, href }) => (
              <div key={etiqueta}>
                <dt>{etiqueta}</dt>
                <dd><Link href={href}>{valor}</Link></dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
