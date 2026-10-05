import Link from "next/link";
import type { ComponentType } from "react";

import { IconoEtiqueta, IconoMoneda, IconoPedidos, IconoSoporte, IconoUbicacion, type PropsIcono } from "../iconos";
import { Beneficio, type PropsBeneficio } from "./Beneficio";
import { BloqueColeccion, type PropsBloqueColeccion } from "./BloqueColeccion";
import { CarruselPortada } from "./CarruselPortada";
import type { PropsTarjetaProducto } from "./TarjetaProducto";

import "./estilos/escaparate-portada.css";

export interface PropsEscaparatePortada {
  titulo: string;
  subtitulo: string;
  productos: PropsTarjetaProducto[];
  beneficios: PropsBeneficio[];
  coleccion: PropsBloqueColeccion;
}

interface AtajoCompra {
  Icono: ComponentType<PropsIcono>;
  titulo: string;
  detalle: string;
  href: string;
}

const atajos: AtajoCompra[] = [
  { Icono: IconoEtiqueta, titulo: "Guía de tallas", detalle: "Elige sin dudar", href: "/guia-tallas" },
  { Icono: IconoUbicacion, titulo: "Envíos", detalle: "Zonas y tiempos", href: "/envios" },
  { Icono: IconoMoneda, titulo: "Medios de pago", detalle: "Yape, Plin y transferencia", href: "/ayuda/preguntas-frecuentes" },
  { Icono: IconoPedidos, titulo: "Cambios y devoluciones", detalle: "Cómo funcionan", href: "/ayuda/cambios-y-devoluciones" },
  { Icono: IconoSoporte, titulo: "Contacto", detalle: "Te respondemos", href: "/ayuda/contacto" },
];

/**
 * Portada en panel: presentación y panel de compra a la izquierda, producto
 * protagonista a la derecha con la colección flotando encima y una fila de
 * tarjetas informativas al pie.
 */
export function EscaparatePortada({ titulo, subtitulo, productos, beneficios, coleccion }: PropsEscaparatePortada) {
  return (
    <main className="ui-escaparate">
      <div className="ui-escaparate__panel">
        <header className="ui-escaparate__intro">
          <h1 className="ui-escaparate__titulo">{titulo}</h1>
          <p className="ui-escaparate__subtitulo">{subtitulo}</p>
        </header>

        <section className="ui-escaparate__producto" aria-label="Producto destacado">
          <CarruselPortada productos={productos} />
        </section>

        <div className="ui-escaparate__coleccion">
          <BloqueColeccion {...coleccion} />
        </div>

        <section className="ui-escaparate__compra" aria-labelledby="escaparate-compra">
          <div className="ui-escaparate__compra-cabecera">
            <h2 id="escaparate-compra">Compra tranquila</h2>
            <p>Lo que necesitas saber antes de pedir</p>
          </div>

          <ul className="ui-escaparate__atributos" aria-label="Ventajas de compra">
            {beneficios.map(({ etiqueta, titulo: tituloBeneficio, detalle }) => (
              <li key={tituloBeneficio}>
                <Beneficio etiqueta={etiqueta} titulo={tituloBeneficio} detalle={detalle} />
              </li>
            ))}
          </ul>

          <ul className="ui-escaparate__atajos" aria-label="Atajos de ayuda">
            {atajos.map(({ Icono, titulo: tituloAtajo, detalle, href }) => (
              <li key={href}>
                <Link className="ui-escaparate__atajo" href={href}>
                  <Icono tamano={20} className="ui-escaparate__atajo-icono" />
                  <span className="ui-escaparate__atajo-texto">
                    <strong>{tituloAtajo}</strong>
                    <span>{detalle}</span>
                  </span>
                  <span className="ui-escaparate__atajo-flecha" aria-hidden="true">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--entrega">
          <div className="ui-escaparate__tarjeta-cabecera">
            <h2>Envíos a todo el Perú</h2>
            <p>Consulta zonas y tiempos de entrega</p>
          </div>
          <Link className="ui-escaparate__enlace-informativo" href="/envios">Información de envíos</Link>
        </article>

        <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--tallas">
          <div className="ui-escaparate__tarjeta-cabecera">
            <h2>Encuentra tu talla</h2>
            <p>Revisa la guía antes de elegir</p>
          </div>
          <Link className="ui-escaparate__enlace-informativo" href="/guia-tallas">Ver guía de tallas</Link>
        </article>

        <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--pago">
          <div className="ui-escaparate__tarjeta-cabecera">
            <h2>Compra con confianza</h2>
            <p>Pago seguro y atención para tus consultas</p>
          </div>
          <Link className="ui-escaparate__enlace-informativo" href="/ayuda/contacto">Contactar a la tienda</Link>
        </article>
      </div>
    </main>
  );
}
