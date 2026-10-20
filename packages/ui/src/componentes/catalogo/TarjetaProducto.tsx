import Link from "next/link";

import { CALIFICACION, MONEDA } from "@appweb/core/formato";

import {
  IconoCamion,
  IconoEstrella,
  IconoEstrellaRellena,
  IconoFlash,
  IconoFlechaIzquierda,
  IconoLlama,
} from "../../iconos";
import { ContadorOferta } from "./ContadorOferta";
import { Precio } from "./Precio";

import { FotoProducto } from "./FotoProducto";

import "../estilos.css";
import "./tarjeta-oferta.css";

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
  /**
   * Precio pagando por transferencia, ya resuelto en @appweb/core. Si llega,
   * es el precio principal y `precio` pasa a la linea "Normal".
   */
  precioTransferencia?: number | null;
  /** Aviso de entrega ya redactado: "Llega gratis el miércoles". Sin el, no hay linea. */
  entrega?: string | null;
  /** Ya calculado por `resolverPrecio` de @appweb/core; esta tarjeta no calcula nada. */
  descuentoPct?: number | null;
  /** Insignia libre sobre la imagen: "Nuevo", "Más vendido". */
  etiqueta?: string | null;
  /** Muestra "Envio gratis" sobre la foto, abajo. Sin el, no hay etiqueta. */
  envioGratis?: boolean;
  marca?: string | null;
  /** Ya calculado por `resolverDisponibilidad` de @appweb/core. */
  disponible: boolean;
  /**
   * Decide el ancho de imagen que solicita el navegador.
   */
  contexto?: "rejilla" | "carrusel" | "portada";
  presentacion?: "catalogo" | "portada" | "oferta";
  /** Solo en `oferta`: fin de la oferta (ISO 8601 con zona). Sin fecha, no hay contador. */
  terminaEn?: string;
  /** Solo en `oferta`: unidades que quedan; sin ellas no hay linea de stock. */
  stockRestante?: number | null;
  /** Solo en `oferta`: % de lo ingresado que sigue en almacen (0-100); sin el, no hay barra. */
  stockPct?: number | null;
  /**
   * Nota de las reseñas publicadas, ya resumida por `resumenCalificacion` de
   * @appweb/core. `null` = sin reseñas: la tarjeta dice "Sin opiniones".
   */
  calificacion?: { promedio: number; total: number } | null;
}

/** Lo que muestra la tarjeta de un producto que aun no tiene reseñas. */
const SIN_RESENAS = { promedio: 0, total: 0 };

/**
 * Estrella, nota y cuantas reseñas la respaldan: "★ 4.7 (12)". Sin reseñas,
 * estrella vacia y "Sin opiniones": ningun numero que se lea como mala nota
 * ni una nota que nadie puso.
 */
function NotaDeTarjeta({
  clase,
  calificacion,
}: {
  clase: string;
  calificacion: { promedio: number; total: number };
}) {
  if (calificacion.total === 0) {
    return (
      <span className={`${clase} ${clase}--sin-resenas`}>
        <IconoEstrella tamano={12} />
        <span className="ui-solo-lectores">Sin opiniones</span>
      </span>
    );
  }

  const nota = CALIFICACION.format(calificacion.promedio);
  const opiniones = calificacion.total === 1 ? "opinión" : "opiniones";
  return (
    <span className={clase}>
      <IconoEstrellaRellena tamano={12} />
      <span aria-hidden="true">
        <span className={`${clase}-nota`}>{nota}</span> ({calificacion.total})
      </span>
      <span className="ui-solo-lectores">
        Calificación {nota} de 5, {calificacion.total} {opiniones}
      </span>
    </span>
  );
}

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
  precioTransferencia,
  entrega,
  descuentoPct,
  etiqueta,
  envioGratis = false,
  marca,
  disponible,
  contexto = "rejilla",
  presentacion = "catalogo",
  terminaEn,
  stockRestante,
  stockPct,
  calificacion,
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

  if (presentacion === "oferta") {
    return (
      <Link className="ui-tarjeta-oferta" href={`/productos/${slug}`}>
        <span className="ui-tarjeta-oferta__imagen">
          <FotoProducto
            src={imagenUrl}
            alt={nombre}
            width={400}
            height={400}
            sizes="(min-width: 64rem) 160px, 40vw"
            loading="lazy"
            leyenda={false}
          />
        </span>
        <span className="ui-tarjeta-oferta__contenido">
          <span className="ui-tarjeta-oferta__nombre">{nombre}</span>
          <NotaDeTarjeta
            clase="ui-tarjeta-oferta__calificacion"
            calificacion={calificacion ?? SIN_RESENAS}
          />
          <span className="ui-tarjeta-oferta__precio">
            <Precio valor={precio} antes={precioLista ?? null} tamano="md" />
          </span>
          <span className="ui-tarjeta-oferta__estado">
            {disponible
              ? stockRestante != null
                ? `Disponible: ${stockRestante}`
                : "Disponible"
              : "Agotado"}
          </span>
          {stockPct != null ? (
            <span
              className="ui-tarjeta-oferta__stock"
              role="progressbar"
              aria-label="Stock restante"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stockPct}
            >
              <span
                className="ui-tarjeta-oferta__stock-relleno"
                style={{ inlineSize: `${stockPct}%` }}
              />
            </span>
          ) : null}
          {terminaEn ? <ContadorOferta terminaEn={terminaEn} /> : null}
        </span>
      </Link>
    );
  }

  const claseTarjeta = `ui-tarjeta-producto ${portada ? "ui-tarjeta-producto--portada" : "ui-tarjeta-producto--vertical"}`;

  const contenido = (
    <>
      {portada && categoriaSlug ? (
        <Link
          className="ui-tarjeta-producto__volver"
          href={`/categorias/${categoriaSlug}`}
          aria-label={`Ver categoría ${categoria ?? ""}`}
        >
          <IconoFlechaIzquierda tamano={16} />
        </Link>
      ) : null}
      <span className="ui-tarjeta-producto__imagen">
        <FotoProducto
          src={imagenUrl}
          alt={nombre}
          width={400}
          height={400}
          sizes={portada ? ANCHOS.portada : ANCHOS[contexto === "portada" ? "rejilla" : contexto]}
          loading={portada ? "eager" : "lazy"}
          {...(portada ? { fetchPriority: "high" as const } : {})}
        />
        {/* Esquina izquierda: Nuevo. Oferta va en la info. */}
        {!portada && esNuevo ? (
          <span className="ui-tarjeta-producto__esquina">
            {esNuevo ? <span className="ui-tarjeta-producto__nuevo">Nuevo</span> : null}
          </span>
        ) : null}
        {descuentoPct ? (
          <span className="ui-tarjeta-producto__insignia">-{descuentoPct}%</span>
        ) : null}
        {!portada && (envioGratis || etiqueta) ? (
          <span className="ui-tarjeta-producto__apilado">
            {envioGratis ? <span className="ui-tarjeta-producto__envio">Envío gratis</span> : null}
            {etiqueta ? (
              <span
                className={[
                  "ui-tarjeta-producto__etiqueta",
                  etiquetaEnInfo ? "ui-tarjeta-producto__etiqueta--info" : "",
                  esNuevo ? "ui-tarjeta-producto__etiqueta--nuevo" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {etiqueta}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>

      <div className="ui-tarjeta-producto__contenido">
        {portada && categoria ? (
          <span className="ui-tarjeta-producto__etiqueta">{categoria}</span>
        ) : null}
        {!portada && entrega ? (
          <span className="ui-tarjeta-producto__entrega">
            <IconoCamion tamano={14} />
            {entrega}
          </span>
        ) : null}
        {portada ? (
          marca ? (
            <span className="ui-tarjeta-producto__marca">{marca}</span>
          ) : null
        ) : (
          <span className="ui-tarjeta-producto__fila-marca">
            {marca ? <span className="ui-tarjeta-producto__marca">{marca}</span> : null}
            <NotaDeTarjeta
              clase="ui-tarjeta-producto__calificacion"
              calificacion={calificacion ?? SIN_RESENAS}
            />
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
        {portada && descripcionCorta ? (
          <span className="ui-tarjeta-producto__descripcion">{descripcionCorta}</span>
        ) : null}
        {portada && tallas && tallas.length > 0 ? (
          <span className="ui-tarjeta-producto__tallas" aria-label="Tallas disponibles">
            {tallas.map((talla) => (
              <span key={talla}>{talla}</span>
            ))}
          </span>
        ) : null}
        {!portada && disponible && tallas && tallas.length > 0 ? (
          <span className="ui-tarjeta-producto__tallas-texto">
            <span className="ui-solo-lectores">Tallas:</span>
            {tallas.map((talla) => (
              <span key={talla} className="ui-tarjeta-producto__talla">
                {talla}
              </span>
            ))}
          </span>
        ) : null}
        {!portada && !disponible ? (
          <span className="ui-tarjeta-producto__estado ui-tarjeta-producto__estado--agotado">
            Agotado
          </span>
        ) : null}

        {/* `?? null`: precioLista opcional puede llegar como `undefined`, y
            exactOptionalPropertyTypes distingue "prop omitida" de "prop en
            undefined". Precio si acepta null. */}
        {!portada && precioTransferencia != null ? (
          <span className="ui-tarjeta-producto__precio-fila ui-tarjeta-producto__precio-fila--transferencia">
            <span className="ui-tarjeta-producto__precio-etiqueta">Transferencia</span>
            <Precio valor={precioTransferencia} antes={precioLista ?? null} tamano="md" />
            <span className="ui-tarjeta-producto__precio-normal">
              Normal {MONEDA.format(precio)}
            </span>
          </span>
        ) : (
          <span className="ui-tarjeta-producto__precio-fila">
            <Precio valor={precio} antes={precioLista ?? null} tamano={portada ? "lg" : "md"} />
          </span>
        )}
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
