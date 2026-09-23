import Link from "next/link";
import { IconoBeneficio } from "../iconos";

import "./estilos/escaparate-portada.css";

export interface PropsEscaparatePortada {
  nombre: string;
  subtitulo: string;
  imagen: string;
  categoria: string;
  precio: string;
}

const beneficios = [
  { nombre: "security", titulo: "Seguridad", detalle: "Compra segura y protegida." },
  { nombre: "box-time", titulo: "Envíos", detalle: "Recibe tus pedidos rápido." },
  { nombre: "verify", titulo: "Garantía", detalle: "Productos respaldados por nosotros." },
  { nombre: "message-text", titulo: "Soporte", detalle: "Estamos aquí para ayudarte." },
] as const;

export function EscaparatePortada({ nombre, subtitulo, imagen, categoria, precio }: PropsEscaparatePortada) {
  return (
    <main className="ui-escaparate">
      <section className="ui-escaparate__escena" aria-labelledby="producto-destacado">
        <div className="ui-escaparate__centro">
          <p className="ui-escaparate__ceja">{categoria}</p>
          <h1 id="producto-destacado">{nombre}</h1>
          <p className="ui-escaparate__subtitulo">{subtitulo}</p>
          <Link className="ui-escaparate__accion" href="/categorias/hombres">
            Explora la colección <span aria-hidden="true">↗</span>
          </Link>
          <div className="ui-escaparate__producto">
            <span className="ui-escaparate__halo" aria-hidden="true" />
            <img src={imagen} alt={nombre} />
            <span className="ui-escaparate__sombra" aria-hidden="true" />
          </div>
          <div className="ui-escaparate__datos-producto" aria-label="Detalles del producto">
            <div><span>Estilo</span><strong>Botánico</strong></div>
            <div><span>Uso</span><strong>Todos los días</strong></div>
            <div><span>Desde</span><strong>{precio}</strong></div>
          </div>
        </div>

        <aside className="ui-escaparate__lateral ui-escaparate__lateral--izquierdo" aria-label="Descubre la colección">
          <article className="ui-escaparate__editorial">
            <span className="ui-escaparate__etiqueta">Nueva colección</span>
            <div className="ui-escaparate__editorial-imagen" aria-hidden="true">
              <img src={imagen} alt="" />
            </div>
            <div className="ui-escaparate__editorial-texto">
              <span>Para tu día a día</span>
              <strong>Comodidad con personalidad.</strong>
            </div>
          </article>
          <div className="ui-escaparate__atributos">
            <article><span>Diseño</span><strong>Botánico</strong><small>Un básico diferente</small></article>
            <article><span>Comodidad</span><strong>Diaria</strong><small>Para cada momento</small></article>
            <article><span>Colección</span><strong>Nueva</strong><small>Descubre más estilos</small></article>
            <article><span>Precio</span><strong>{precio}</strong><small>Boxer individual</small></article>
          </div>
          <Link className="ui-escaparate__lateral-enlace" href="/categorias/hombres">
            Ver la colección <span aria-hidden="true">↗</span>
          </Link>
        </aside>

        <aside className="ui-escaparate__lateral ui-escaparate__lateral--derecho" aria-label="Información de compra">
          <article className="ui-escaparate__informacion ui-escaparate__informacion--promocion">
            <span className="ui-escaparate__etiqueta">Edición especial</span>
            <div><h2>Renueva tus básicos</h2><p>Comodidad que te acompaña todos los días.</p></div>
            <Link href="/categorias/hombres">Descubre la colección <span aria-hidden="true">↗</span></Link>
          </article>
          <article className="ui-escaparate__informacion ui-escaparate__informacion--tallas">
            <span className="ui-escaparate__etiqueta">Tu talla</span>
            <div className="ui-escaparate__tallas" aria-label="Tallas disponibles">
              <span>S</span><span>M</span><span>L</span><span>XL</span>
            </div>
            <Link href="/guia-tallas">Consulta la guía de tallas <span aria-hidden="true">↗</span></Link>
          </article>
          <article className="ui-escaparate__informacion ui-escaparate__informacion--entrega">
            <span className="ui-escaparate__etiqueta">Envíos</span>
            <div><h2>Tu entrega</h2><p>Lima Metropolitana</p></div>
            <Link href="/envios">Ver información de envíos <span aria-hidden="true">↗</span></Link>
          </article>
        </aside>
      </section>

      <section className="ui-escaparate__franja" aria-label="Producto y beneficios de compra">
        <article className="ui-escaparate__compra">
          <div>
            <span className="ui-escaparate__etiqueta">Destacado</span>
            <h2>{nombre}</h2>
            <p>{subtitulo}</p>
            <strong>{precio}</strong>
            <Link href="/categorias/hombres">Ver colección <span aria-hidden="true">↗</span></Link>
          </div>
          <img src={imagen} alt="" />
        </article>
        <div className="ui-escaparate__beneficios">
          {beneficios.map((beneficio) => (
            <article className="ui-escaparate__beneficio" key={beneficio.nombre}>
              <span className="ui-escaparate__beneficio-icono"><IconoBeneficio nombre={beneficio.nombre} /></span>
              <div><h2>{beneficio.titulo}</h2><p>{beneficio.detalle}</p></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
