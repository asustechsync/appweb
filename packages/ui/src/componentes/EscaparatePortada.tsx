import Link from "next/link";
import { Beneficio, type PropsBeneficio } from "./Beneficio";
import { BloqueColeccion, type PropsBloqueColeccion } from "./BloqueColeccion";
import { CarruselPortada } from "./CarruselPortada";
import { CarruselMarcas } from "./CarruselMarcas";
import type { PropsTarjetaMarca } from "./TarjetaMarca";
import type { PropsTarjetaProducto } from "./TarjetaProducto";

import "./estilos/escaparate-portada.css";

export interface PropsEscaparatePortada {
  productos: PropsTarjetaProducto[];
  beneficios: PropsBeneficio[];
  coleccion: PropsBloqueColeccion;
  marcas?: PropsTarjetaMarca[];
}

export function EscaparatePortada({ productos, beneficios, coleccion, marcas }: PropsEscaparatePortada) {
  return (
    <main className="ui-escaparate">
      <section className="ui-escaparate__panel" aria-label="Portada y beneficios destacados">
        <div className="ui-escaparate__cuerpo">
          <section className="ui-escaparate__producto" aria-label="Producto destacado">
            <CarruselPortada productos={productos} />
          </section>

          <section className="ui-escaparate__asistente" aria-label="Colección destacada y beneficios de compra">
            <BloqueColeccion {...coleccion} />
            <ul className="ui-escaparate__atributos" aria-label="Ventajas de compra">
              {beneficios.map(({ etiqueta, titulo, detalle }) => (
                <li key={titulo}>
                  <Beneficio etiqueta={etiqueta} titulo={titulo} detalle={detalle} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        {marcas && marcas.length > 0 ? (
          <section className="ui-escaparate__marcas" aria-label="Marcas destacadas">
            <CarruselMarcas marcas={marcas} orientacion="horizontal" />
          </section>
        ) : null}

        <section className="ui-escaparate__tarjetas" aria-label="Información para comprar">
          <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--entrega">
            <div className="ui-escaparate__tarjeta-cabecera">
              <div><h2>Envíos a todo el Perú</h2><p>Consulta zonas y tiempos de entrega</p></div>
            </div>
            <Link className="ui-escaparate__enlace-informativo" href="/envios">Información de envíos</Link>
          </article>

          <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--tallas">
            <div className="ui-escaparate__tarjeta-cabecera">
              <div><h2>Encuentra tu talla</h2><p>Revisa la guía antes de elegir</p></div>
            </div>
            <Link className="ui-escaparate__enlace-informativo" href="/guia-tallas">Ver guía de tallas</Link>
          </article>

          <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--pago">
            <div className="ui-escaparate__tarjeta-cabecera">
              <div><h2>Compra con confianza</h2><p>Pago seguro y atención para tus consultas</p></div>
            </div>
            <Link className="ui-escaparate__enlace-informativo" href="/ayuda/contacto">Contactar a la tienda</Link>
          </article>
        </section>
      </section>
    </main>
  );
}
