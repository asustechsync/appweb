import Link from "next/link";
import { Beneficio, type PropsBeneficio } from "./Beneficio";
import { TarjetaProducto, type PropsTarjetaProducto } from "./TarjetaProducto";

import "./estilos/escaparate-portada.css";

export interface PropsEscaparatePortada {
  nombre: string;
  subtitulo: string;
  imagen: string;
  categoria: string;
  precio: string;
  beneficios: PropsBeneficio[];
  productoColeccion?: PropsTarjetaProducto | undefined;
}

export function EscaparatePortada({ nombre, subtitulo, imagen, categoria, precio, beneficios, productoColeccion }: PropsEscaparatePortada) {
  return (
    <main className="ui-escaparate">
      <section className="ui-escaparate__panel" aria-label="Producto y beneficios destacados">
        <div className="ui-escaparate__cuerpo">
          <section className="ui-escaparate__producto" aria-label="Producto destacado">
            <div className="ui-escaparate__intro">
              <div>
                <p className="ui-escaparate__ceja">{categoria}</p>
                <h1 id="producto-destacado">{nombre}</h1>
                <p>{subtitulo}</p>
                <p className="ui-escaparate__precio">{precio}</p>
                <Link className="ui-escaparate__enlace-catalogo" href="/categorias/hombres">
                  Explorar boxers
                </Link>
              </div>
            </div>

            <div className="ui-escaparate__foto">
              <div className="ui-escaparate__halo" />
              <img src={imagen} alt={nombre} fetchPriority="high" />
              <span className="ui-escaparate__sombra-producto" />
            </div>
          </section>

          <section className="ui-escaparate__asistente" aria-label="Producto destacado y beneficios de compra">
            {productoColeccion ? (
              <TarjetaProducto {...productoColeccion} etiqueta={productoColeccion.etiqueta ?? categoria} orientacion="horizontal" tituloComo="h2" />
            ) : (
              <article className="ui-escaparate__editorial">
                <span className="ui-escaparate__editorial-etiqueta">{categoria}</span>
                <img src={imagen} alt="" />
                <div className="ui-escaparate__editorial-texto">
                  <span>Para tu día a día</span>
                  <h2 id="titulo-beneficios">Comodidad con personalidad.</h2>
                </div>
              </article>
            )}
            <ul className="ui-escaparate__atributos" aria-label="Ventajas de compra">
              {beneficios.map(({ etiqueta, titulo, detalle }) => (
                <li key={titulo}>
                  <Beneficio etiqueta={etiqueta} titulo={titulo} detalle={detalle} />
                </li>
              ))}
            </ul>
          </section>
        </div>

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
