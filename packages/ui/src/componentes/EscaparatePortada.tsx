import Link from "next/link";
import { IconoBeneficio } from "../iconos/IconoBeneficio";

import "./estilos/escaparate-portada.css";

type NombreIcono =
  | "bolsa"
  | "buscar"
  | "carrito"
  | "flecha"
  | "regalo"
  | "ajustes"
  | "envio"
  | "talla"
  | "pago"
  | "ubicacion"
  | "expandir"
  | "enviar"
  | "cerrar";

function IconoEscaparate({ nombre }: { nombre: NombreIcono }) {
  const trazos: Record<NombreIcono, React.ReactNode> = {
    bolsa: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    buscar: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
    carrito: <><path d="M3 5h2l2 10h10l2-7H6" /><circle cx="9" cy="19" r="1" /><circle cx="17" cy="19" r="1" /></>,
    flecha: <><path d="M19 12H5" /><path d="m10 7-5 5 5 5" /></>,
    regalo: <><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M12 9v11M3 13h18M12 9H8.5A2.5 2.5 0 1 1 12 6.5V9Zm0 0h3.5A2.5 2.5 0 1 0 12 6.5V9Z" /></>,
    ajustes: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    envio: <><path d="M3 6h11v11H3V6Zm11 4h4l3 3v4h-7v-7Z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    talla: <><path d="M5 4v16M5 7h5M5 11h3M5 15h5M5 19h3" /><path d="M14 6h5v12h-5z" /></>,
    pago: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>,
    ubicacion: <><path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
    expandir: <><path d="M8 4H4v4M16 20h4v-4M4 8l5-5M20 16l-5 5" /></>,
    enviar: <><path d="m3 11 18-8-8 18-2-8-8-2Z" /><path d="m11 13 4-4" /></>,
    cerrar: <path d="m7 7 10 10M17 7 7 17" />,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {trazos[nombre]}
    </svg>
  );
}

export interface PropsEscaparatePortada {
  nombre: string;
  subtitulo: string;
  imagen: string;
  categoria: string;
  precio: string;
}

interface BeneficioCompra {
  titulo: string;
  principal: string;
  detalle: string;
}

const beneficiosCompra: BeneficioCompra[] = [
  { titulo: "Seguridad", principal: "Protección", detalle: "En cada compra" },
  { titulo: "Envíos", principal: "Nacionales", detalle: "A todo el Perú" },
  { titulo: "Garantía", principal: "Respaldo", detalle: "En cada pedido" },
  { titulo: "Soporte", principal: "Atención", detalle: "A tus consultas" },
];

function TarjetaBeneficio({ titulo, principal, detalle }: BeneficioCompra) {
  return (
    <article className="ui-escaparate__tarjeta-beneficio">
      <span>{titulo}</span>
      <strong>{principal}</strong>
      <small>{detalle}</small>
    </article>
  );
}

function AvisoEnvioGratis() {
  return (
    <div className="ui-escaparate__envio-gratis">
      <span className="ui-escaparate__envio-icono" aria-hidden="true"><IconoBeneficio nombre="box-time" fino /></span>
      <span className="ui-escaparate__envio-texto">
        <strong>Envío gratis</strong>
        <small>En compras desde <b>S/ 99</b></small>
      </span>
    </div>
  );
}

function SeccionBeneficios({ categoria, imagen }: { categoria: string; imagen: string }) {
  return (
    <section className="ui-escaparate__asistente" aria-label="Beneficios de compra">
      <article className="ui-escaparate__editorial">
        <span className="ui-escaparate__editorial-etiqueta">{categoria}</span>
        <img src={imagen} alt="" />
        <div className="ui-escaparate__editorial-texto">
          <span>Para tu día a día</span>
          <h2>Comodidad con personalidad.</h2>
        </div>
      </article>
      <div className="ui-escaparate__atributos">
        {beneficiosCompra.map((beneficio) => <TarjetaBeneficio key={beneficio.titulo} {...beneficio} />)}
      </div>
      <AvisoEnvioGratis />
    </section>
  );
}

const tallas = ["S", "M", "L", "XL"];

export function EscaparatePortada({ nombre, subtitulo, imagen, categoria, precio }: PropsEscaparatePortada) {
  return (
    <main className="ui-escaparate">
      <section className="ui-escaparate__panel" aria-labelledby="producto-destacado">
        <div className="ui-escaparate__cuerpo">
          <aside className="ui-escaparate__rail" aria-label="Acciones rápidas">
            <Link className="ui-escaparate__boton-icono" href="/categorias/hombres" aria-label="Catálogo"><IconoEscaparate nombre="bolsa" /></Link>
            <Link className="ui-escaparate__boton-icono" href="/buscar" aria-label="Filtros"><IconoEscaparate nombre="ajustes" /></Link>
            <Link className="ui-escaparate__boton-icono" href="/carrito" aria-label="Carrito"><IconoEscaparate nombre="carrito" /></Link>
          </aside>

          <div className="ui-escaparate__producto">
            <div className="ui-escaparate__intro">
              <Link className="ui-escaparate__boton-icono" href="/categorias/hombres" aria-label="Volver al catálogo"><IconoEscaparate nombre="flecha" /></Link>
              <div>
                <p className="ui-escaparate__ceja">{categoria}</p>
                <h1 id="producto-destacado">{nombre}</h1>
                <p>{subtitulo}</p>
              </div>
            </div>

            <div className="ui-escaparate__tallas" aria-label="Tallas disponibles">
              {tallas.map((talla, indice) => <span className={indice === 2 ? "ui-escaparate__talla ui-escaparate__talla--activa" : "ui-escaparate__talla"} key={talla}>{talla}</span>)}
            </div>

            <div className="ui-escaparate__foto">
              <div className="ui-escaparate__halo" />
              <img src={imagen} alt={nombre} />
              <span className="ui-escaparate__sombra-producto" />
            </div>
          </div>

          <div className="ui-escaparate__promocion-asistente">
            <SeccionBeneficios categoria={categoria} imagen={imagen} />
          </div>
        </div>

        <div className="ui-escaparate__tarjetas">
          <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--entrega">
            <div className="ui-escaparate__tarjeta-cabecera">
              <div><h2>Tu entrega</h2><p>Lima Metropolitana</p></div>
              <button className="ui-escaparate__boton-icono" type="button" aria-label="Ampliar entrega"><IconoEscaparate nombre="expandir" /></button>
            </div>
            <div className="ui-escaparate__mapa">
              <i /><i /><i /><i /><i />
              <span><IconoEscaparate nombre="ubicacion" /></span>
            </div>
          </article>

          <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--tallas">
            <div className="ui-escaparate__tarjeta-cabecera">
              <div><h2>Elige tu talla</h2><p>Calce preciso y cómodo</p></div>
              <button className="ui-escaparate__boton-icono" type="button" aria-label="Abrir guía de tallas"><IconoEscaparate nombre="expandir" /></button>
            </div>
            <div className="ui-escaparate__selector-grande">
              <button type="button" aria-label="Talla anterior">‹</button>
              <strong>L</strong>
              <button type="button" aria-label="Talla siguiente">›</button>
              <span>Recomendada</span>
            </div>
          </article>

          <article className="ui-escaparate__tarjeta ui-escaparate__tarjeta--pago">
            <div className="ui-escaparate__tarjeta-cabecera">
              <div><h2>Completa tu compra</h2><p>Pago seguro y protegido</p></div>
              <button className="ui-escaparate__boton-icono" type="button" aria-label="Ampliar pago"><IconoEscaparate nombre="expandir" /></button>
            </div>
            <div className="ui-escaparate__resumen">
              <IconoEscaparate nombre="carrito" />
              <div><strong>Boxer individual</strong><span>{precio}</span></div>
              <Link href="/carrito">Agregar</Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
