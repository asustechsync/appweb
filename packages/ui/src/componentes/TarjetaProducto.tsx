import Image from "next/image";
import Link from "next/link";

import { IconoEstrella, IconoFlash, IconoFlechaIzquierda, IconoLlama } from "../iconos";
import { Precio } from "./Precio";

import "./primitivos.css";

export interface PropsTarjetaProducto {
  slug: string;
  nombre: string;
  descripcionCorta?: string | null;
  categoria?: string | null;
  categoriaSlug?: string;
  tallas?: string[];
  imagenUrl: string;
  precio: number;
  /** Precio tachado. `null`/omitido si no hay oferta. */
  precioLista?: number | null;
  /** Ya calculado por `resolverPrecio` de @appweb/core; esta tarjeta no calcula nada. */
  descuentoPct?: number | null;
  /** Insignia libre sobre la imagen: "Nuevo", "Más vendido". */
  etiqueta?: string | null;
  marca?: string | null;
  /** Ya calculado por `resolverDisponibilidad` de @appweb/core. */
  disponible: boolean;
  /**
   * Decide el ancho de imagen que solicita el navegador.
   */
  contexto?: "rejilla" | "carrusel" | "portada";
  presentacion?: "catalogo" | "portada";
}

/**
 * Calificacion provisional: aun no hay resenas en la base, asi que todas las
 * tarjetas muestran el mismo valor. Cuando exista el dato, pasa a ser una
 * prop calculada en packages/core, no un numero fijo aqui.
 */
const CALIFICACION_PROVISIONAL = "4.9";

/**
 * Ancho real de la tarjeta en cada contexto, para que el navegador no baje
 * una imagen mas grande de la que se ve.
 *
 * En el carrusel pedir el ancho de la rejilla descargaría una imagen mucho
 * mayor de lo que se muestra.
 */
const ANCHOS: Record<"rejilla" | "carrusel" | "portada", string> = {
  // 2 columnas en movil, 3 desde 40rem y 4 desde 64rem, donde el contenedor
  // topa en 1400px y cada tarjeta no pasa de ~330px.
  rejilla: "(min-width: 64rem) 350px, (min-width: 40rem) 33vw, 50vw",
  // De 3 tarjetas visibles en movil a 7 en escritorio (ver --visibles).
  carrusel: "(min-width: 64rem) 190px, (min-width: 40rem) 20vw, 30vw",
  portada: "(min-width: 64rem) 50vw, (min-width: 48rem) 45vw, 85vw",
};

/**
 * Tarjeta de producto para cualquier listado: rejilla de categoria, ofertas,
 * destacados. No sabe de donde vienen los datos ni si es una oferta "de
 * verdad" — solo pinta lo que recibe.
 */
export function TarjetaProducto({
  slug,
  nombre,
  descripcionCorta,
  categoria,
  categoriaSlug,
  tallas,
  imagenUrl,
  precio,
  precioLista,
  descuentoPct,
  etiqueta,
  marca,
  disponible,
  contexto = "rejilla",
  presentacion = "catalogo",
}: PropsTarjetaProducto) {
  const portada = presentacion === "portada";
  const claveEtiqueta = etiqueta?.trim().toLowerCase();
  // "Tendencia" era el nombre anterior de esta etiqueta: se sigue aceptando
  // para que datos viejos (o en cache) tambien muestren la pastilla "Top".
  const esTendencia = claveEtiqueta === "top" || claveEtiqueta === "tendencia";
  // Oferta sale de que el producto tenga descuento real, no de la palabra guardada
  // en su etiqueta: asi todo producto rebajado la lleva, sea "Nuevo" o "Tendencia".
  const esOferta = Boolean(descuentoPct) || claveEtiqueta === "oferta";
  const esNuevo = claveEtiqueta === "nuevo";
  // Estas cuatro etiquetas tienen pastilla propia en la info.
  const etiquetaEnInfo = esTendencia || esOferta || esNuevo;

  const claseTarjeta = `ui-tarjeta-producto ${portada ? "ui-tarjeta-producto--portada" : "ui-tarjeta-producto--vertical"}`;

  const contenido = (
    <>
      {portada && categoriaSlug ? (
        <Link className="ui-tarjeta-producto__volver" href={`/categorias/${categoriaSlug}`} aria-label={`Ver categoría ${categoria ?? ""}`}>
          <IconoFlechaIzquierda tamano={16} />
        </Link>
      ) : null}
      <span className="ui-tarjeta-producto__imagen">
        {/* Sin imagen queda el fondo del recuadro: `next/image` con src vacio
            lanza en tiempo de ejecucion, y un producto sin foto no puede
            tumbar el listado entero. */}
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={nombre}
            width={400}
            height={400}
            sizes={portada ? ANCHOS.portada : ANCHOS[contexto === "portada" ? "rejilla" : contexto]}
            loading={portada ? "eager" : "lazy"}
            fetchPriority={portada ? "high" : undefined}
          />
        ) : null}
        {/* Esquina izquierda: Nuevo. Oferta va en la info. */}
        {!portada && esNuevo ? (
          <span className="ui-tarjeta-producto__esquina">
            {esNuevo ? <span className="ui-tarjeta-producto__nuevo">Nuevo</span> : null}
          </span>
        ) : null}
        {descuentoPct ? (
          <span className="ui-tarjeta-producto__insignia">-{descuentoPct}%</span>
        ) : null}
        {!portada && etiqueta ? (
          <span
            className={
              etiquetaEnInfo
                ? "ui-tarjeta-producto__etiqueta ui-tarjeta-producto__etiqueta--info"
                : "ui-tarjeta-producto__etiqueta"
            }
          >
            {etiqueta}
          </span>
        ) : null}
      </span>

      <div className="ui-tarjeta-producto__contenido">
        {portada && categoria ? <span className="ui-tarjeta-producto__etiqueta">{categoria}</span> : null}
        {portada ? (
          marca ? <span className="ui-tarjeta-producto__marca">{marca}</span> : null
        ) : (
          <span className="ui-tarjeta-producto__marca-fila">
            {marca ? <span className="ui-tarjeta-producto__marca">{marca}</span> : null}
            <span className="ui-tarjeta-producto__calificacion" aria-label={`Calificacion ${CALIFICACION_PROVISIONAL}`}>
              <IconoEstrella tamano={12} relleno />
              {CALIFICACION_PROVISIONAL}
            </span>
          </span>
        )}
        {portada ? (
          <Link className="ui-tarjeta-producto__nombre-enlace" href={`/productos/${slug}`}>
            <span className="ui-tarjeta-producto__nombre">{nombre}</span>
          </Link>
        ) : (
          <span className="ui-tarjeta-producto__nombre">{nombre}</span>
        )}
        {/* Etiqueta de la info: top. El hueco se reserva siempre (aunque el producto
            no la tenga) para que todas las tarjetas de un listado midan igual. Cada
            listado decide si lo muestra; en el catalogo queda oculto. */}
        {!portada ? (
          <span className="ui-tarjeta-producto__etiquetas">
            {esOferta ? (
              <span className="ui-tarjeta-producto__oferta">
                <IconoFlash tamano={11} />
                Oferta
              </span>
            ) : null}
            {esTendencia ? (
              <span className="ui-tarjeta-producto__tendencia">
                <IconoLlama tamano={11} />
                Top
              </span>
            ) : null}
          </span>
        ) : null}
        {portada && descripcionCorta ? <span className="ui-tarjeta-producto__descripcion">{descripcionCorta}</span> : null}
        {portada && tallas && tallas.length > 0 ? (
          <span className="ui-tarjeta-producto__tallas" aria-label="Tallas disponibles">
            {tallas.map((talla) => <span key={talla}>{talla}</span>)}
          </span>
        ) : null}
        {!portada ? (
          <span
            className={
              disponible
                ? "ui-tarjeta-producto__estado ui-tarjeta-producto__estado--disponible"
                : "ui-tarjeta-producto__estado ui-tarjeta-producto__estado--agotado"
            }
          >
            {disponible ? "Disponible" : "Agotado"}
          </span>
        ) : null}

        {/* `?? null`: precioLista opcional puede llegar como `undefined`, y
            exactOptionalPropertyTypes distingue "prop omitida" de "prop en
            undefined". Precio si acepta null. */}
        <span className="ui-tarjeta-producto__precio-fila">
          <Precio valor={precio} antes={precioLista ?? null} tamano={portada ? "lg" : "md"} />
        </span>


      </div>
    </>
  );

  return portada ? (
    <article className={claseTarjeta}>{contenido}</article>
  ) : (
    <Link className={claseTarjeta} href={`/productos/${slug}`}>
      {contenido}
    </Link>
  );
}
