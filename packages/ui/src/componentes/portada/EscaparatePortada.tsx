import Link from "next/link";

import type { BannerDePortada } from "@appweb/core";
import { MONEDA } from "@appweb/core/formato";

import { Boton } from "../base/Boton";
import { Beneficio, type PropsBeneficio } from "./Beneficio";
import { Carrusel } from "./Carrusel";
import { CarruselMarcas } from "./CarruselMarcas";
import { CarruselBanners, type BannerDeslizable } from "./CarruselBanners";
import { TarjetaPack, type PropsTarjetaPack } from "./TarjetaPack";
import { RejillaProductos } from "../catalogo/RejillaProductos";
import type { PropsTarjetaMarca } from "../catalogo/TarjetaMarca";
import { TarjetaProducto, type PropsTarjetaProducto } from "../catalogo/TarjetaProducto";

import "./escaparate-portada.css";

/** Un escalon de la escalera de niveles, tal como lo guarda el panel. */
export interface NivelDePortada {
  id: string;
  nombre: string;
  /** Desde cuanto comprado (S/) se alcanza. */
  desde: number;
  descuentoPct: number;
}

export interface PropsEscaparatePortada {
  titulo: string;
  subtitulo: string;
  /** Novedades: ocupan la rejilla cuando todavia no hay ventas que ordenar. */
  productos: PropsTarjetaProducto[];
  /** Los mas vendidos, ya ordenados. Vacio = la rejilla muestra las novedades. */
  masVendidos?: PropsTarjetaProducto[];
  /** Hasta 10 productos con descuento real, en un carrusel de tarjetas de oferta (4 visibles). */
  ofertas?: PropsTarjetaProducto[];
  /** Packs armables hoy. El primero va destacado en la cabecera. */
  packs?: (PropsTarjetaPack & { slug: string })[];
  /** Promociones del carrusel, en orden. Sin banners no se muestra. */
  banners?: BannerDePortada[];
  /** Marcas con productos visibles. Sin marcas no se pinta la seccion (ni su ancla #marcas). */
  marcas?: PropsTarjetaMarca[];
  /** Escalera de niveles. Sin niveles con descuento no se pinta la seccion. */
  niveles?: NivelDePortada[];
  /** Subtotal desde el que el envio sale gratis. `null` = no se promete nada. */
  envioGratisDesde?: number | null;
}

const categorias = [
  { titulo: "Hombre", detalle: "Boxers, calzoncillos y medias", href: "/categorias/hombre" },
  { titulo: "Mujer", detalle: "Ropa interior y medias", href: "/categorias/mujer" },
  { titulo: "Niños", detalle: "De 2 a 14 años", href: "/categorias/ninos" },
  { titulo: "Bebés", detalle: "Algodón suave", href: "/categorias/bebes" },
] as const;

const beneficios: PropsBeneficio[] = [
  { etiqueta: "Pagos", titulo: "Yape, Plin y transferencia", detalle: "Eliges al pagar" },
  { etiqueta: "Envíos", titulo: "A todo el Perú", detalle: "Lima y provincias" },
  { etiqueta: "Cambios", titulo: "Cambios y devoluciones", detalle: "Si la talla no te queda" },
  { etiqueta: "Soporte", titulo: "Atención", detalle: "A tus consultas" },
];

/** Tonos pastel que se turnan los banners, en orden: el contenido no elige color. */
const TONOS: BannerDeslizable["tono"][] = ["oferta", "nuevo", "disponible"];

/** Una promocion del carrusel, tal como la edita el panel. */
// La forma del banner vive en @appweb/core: la comparte la app movil.
export type { BannerDePortada };

/**
 * Portada "packs primero": todo empuja a llevar mas de una prenda. Arriba, el
 * mensaje de la tienda junto al pack de mayor ahorro. Debajo: el resto de
 * packs, categorias, mas vendidos, promociones, ofertas, niveles, mayorista,
 * marcas y confianza. Cada seccion sin datos simplemente no se pinta.
 */
export function EscaparatePortada({
  titulo,
  subtitulo,
  productos,
  masVendidos = [],
  ofertas = [],
  packs = [],
  banners = [],
  marcas = [],
  niveles = [],
  envioGratisDesde = null,
}: PropsEscaparatePortada) {
  const bannersPortada: BannerDeslizable[] = banners.map((banner, i) => ({
    ...banner,
    tono: TONOS[i % TONOS.length] ?? "oferta",
  }));
  const [packDestacado, ...otrosPacks] = packs;
  // Sin packs, la cabecera muestra un producto: el primero con descuento real.
  const productoDestacado = productos.find((p) => p.descuentoPct) ?? productos[0];
  const hayVentas = masVendidos.length > 0;
  const rejilla = hayVentas ? masVendidos : productos;
  const nivelesConPremio = niveles.some((nivel) => nivel.descuentoPct > 0) ? niveles : [];

  return (
    <main className="ui-escaparate">
      <div className="ui-escaparate__panel">
        {envioGratisDesde !== null ? (
          <p className="ui-escaparate__aviso">
            Envío gratis desde {MONEDA.format(envioGratisDesde)}
          </p>
        ) : null}

        <section className="ui-escaparate__cabecera" aria-labelledby="escaparate-titulo">
          <div className="ui-escaparate__mensaje">
            <h1 id="escaparate-titulo" className="ui-escaparate__titulo">
              {titulo}
            </h1>
            <p className="ui-escaparate__subtitulo">{subtitulo}</p>
            <div className="ui-escaparate__acciones">
              {otrosPacks.length > 0 ? (
                <Boton href="#packs">Ver packs</Boton>
              ) : (
                <Boton href="/buscar">Ver catálogo</Boton>
              )}
              {ofertas.length > 0 ? (
                <Boton href="#ofertas" variante="secundario">
                  Ofertas
                </Boton>
              ) : null}
            </div>
          </div>
          <div className="ui-escaparate__destacado">
            {packDestacado ? (
              <TarjetaPack {...packDestacado} presentacion="destacado" />
            ) : productoDestacado ? (
              <TarjetaProducto {...productoDestacado} presentacion="oferta" contexto="portada" />
            ) : null}
          </div>
        </section>

        {otrosPacks.length > 0 ? (
          <section id="packs" className="ui-escaparate__packs" aria-labelledby="escaparate-packs">
            <h2 id="escaparate-packs" className="ui-escaparate__capsula">
              Packs: lleva más, paga menos
            </h2>
            <ul className="ui-escaparate__packs-lista">
              {otrosPacks.map((pack) => (
                <li key={pack.slug}>
                  <TarjetaPack {...pack} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <nav className="ui-escaparate__categorias" aria-label="Compra por categoría">
          <ul className="ui-escaparate__lista">
            {categorias.map((categoria) => (
              <li key={categoria.href}>
                <Link className="ui-escaparate__fila" href={categoria.href}>
                  <span className="ui-escaparate__inicial" aria-hidden="true">
                    {categoria.titulo.charAt(0)}
                  </span>
                  <span className="ui-escaparate__fila-texto">
                    <strong>{categoria.titulo}</strong>
                    <span>{categoria.detalle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {rejilla.length > 0 ? (
          <section className="ui-escaparate__vendidos" aria-labelledby="escaparate-vendidos">
            <div className="ui-escaparate__capsula ui-escaparate__capsula--fila">
              <h2 id="escaparate-vendidos" className="ui-escaparate__capsula-titulo">
                {hayVentas ? "Más vendidos" : "Novedades"}
              </h2>
              <Link className="ui-escaparate__enlace-suave" href="/buscar">
                Ver todo
              </Link>
            </div>
            <RejillaProductos>
              {rejilla.map((producto) => (
                <TarjetaProducto key={producto.slug} {...producto} />
              ))}
            </RejillaProductos>
          </section>
        ) : null}

        {bannersPortada.length > 0 ? (
          <section className="ui-escaparate__banda" aria-label="Promociones">
            <CarruselBanners banners={bannersPortada} etiqueta="Promociones de la tienda" />
          </section>
        ) : null}

        {ofertas.length > 0 ? (
          // `id="ofertas"`: destino del enlace "Ofertas" de la cabecera (/#ofertas).
          <section
            id="ofertas"
            className="ui-escaparate__ofertas"
            aria-labelledby="escaparate-ofertas-flash"
          >
            <h2 id="escaparate-ofertas-flash" className="ui-escaparate__capsula">
              Ofertas
            </h2>
            <Carrusel
              infinito
              etiqueta="Productos en oferta"
              clase="ui-escaparate__ofertas-carrusel"
            >
              {ofertas.map((producto) => (
                <div key={producto.slug} className="ui-escaparate__oferta">
                  <TarjetaProducto {...producto} presentacion="oferta" />
                </div>
              ))}
            </Carrusel>
          </section>
        ) : null}

        {nivelesConPremio.length > 0 ? (
          <section className="ui-escaparate__niveles" aria-labelledby="escaparate-niveles">
            <div className="ui-escaparate__tarjeta-cabecera">
              <div>
                <h2 id="escaparate-niveles" className="ui-escaparate__tarjeta-titulo">
                  Compra y sube de nivel
                </h2>
                <p className="ui-escaparate__nota">
                  Cada compra suma. Tu nivel te da descuento automático en el checkout.
                </p>
              </div>
              <Link className="ui-escaparate__contador" href="/mi-cuenta">
                Ver mi nivel
              </Link>
            </div>
            <ol className="ui-escaparate__escalera">
              {nivelesConPremio.map((nivel) => (
                <li
                  key={nivel.id}
                  className={`ui-escaparate__nivel ui-escaparate__nivel--${nivel.id.toLowerCase()}`}
                >
                  <strong>{nivel.nombre}</strong>
                  <span className="ui-escaparate__nivel-premio">
                    {nivel.descuentoPct > 0 ? `${nivel.descuentoPct}% dscto.` : "Empiezas aquí"}
                  </span>
                  <span className="ui-escaparate__nivel-desde">
                    {nivel.desde > 0 ? `Desde ${MONEDA.format(nivel.desde)}` : "Al registrarte"}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="ui-escaparate__mayorista" aria-labelledby="escaparate-mayorista">
          <div>
            <h2 id="escaparate-mayorista" className="ui-escaparate__tarjeta-titulo">
              ¿Compras por docena?
            </h2>
            <p className="ui-escaparate__nota">
              Precios por volumen para colegios, empresas y revendedores.
            </p>
          </div>
          <Boton href="/mayorista">Cotizar al por mayor</Boton>
        </section>

        {marcas.length > 0 ? (
          // `id="marcas"`: destino del enlace "Marcas" de la cabecera (/#marcas).
          <section
            id="marcas"
            className="ui-escaparate__marcas"
            aria-labelledby="escaparate-marcas"
          >
            <h2 id="escaparate-marcas" className="ui-escaparate__capsula">
              Marcas
            </h2>
            <CarruselMarcas marcas={marcas} orientacion="horizontal" />
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
