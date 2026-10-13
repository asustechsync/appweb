import { IconoVerificado } from "../iconos";
import { GaleriaProducto, type ImagenGaleria } from "./GaleriaProducto";
import { Precio } from "./Precio";
import { SelectorVariantes, type OpcionDeCompra } from "./SelectorVariantes";

import "./primitivos.css";

export interface PropsFichaProducto {
  nombre: string;
  marca?: string | null;
  descripcion?: string | null;
  imagenes: ImagenGaleria[];
  /** Ya resueltos por `resolverPrecio` de @appweb/core. */
  precio: number;
  precioLista?: number | null;
  /** Ya calculado por `resolverPrecio` de @appweb/core: aqui solo se pinta. */
  descuentoPct?: number | null;
  /** Ya resuelta por `resolverDisponibilidad` de @appweb/core. */
  disponible: boolean;
  stockBajo?: boolean;
  stockTotal?: number;
  /** Ya resueltas por `opcionesDeCompra` de @appweb/core. */
  opciones: OpcionDeCompra[];
  onAgregar?: (varianteId: string, cantidad: number) => void;
  agregando?: boolean;
}

/**
 * Ficha completa de un producto: galeria a un lado, datos y compra al otro.
 *
 * Componente de servidor: solo la galeria y el selector se hidratan. Como
 * TarjetaProducto, no calcula nada — recibe precio, disponibilidad y opciones
 * ya resueltos por @appweb/core.
 */
export function FichaProducto({
  nombre,
  marca,
  descripcion,
  imagenes,
  precio,
  precioLista,
  descuentoPct,
  disponible,
  stockBajo,
  stockTotal,
  opciones,
  onAgregar,
  agregando,
}: PropsFichaProducto) {
  return (
    <article className="ui-ficha-producto">
      <div className="ui-ficha-producto__galeria">
        <GaleriaProducto imagenes={imagenes} />
      </div>

      <div className="ui-ficha-producto__panel">
        <h1 className="ui-ficha-producto__nombre">{nombre}</h1>
        {marca ? (
          <span className="ui-ficha-producto__marca">
            {marca}
            <IconoVerificado className="ui-ficha-producto__verificado" tamano={18} />
          </span>
        ) : null}

        <div className="ui-ficha-producto__precio">
          <Precio valor={precio} antes={precioLista ?? null} tamano="lg" separarSimbolo />
          {descuentoPct ? (
            <span className="ui-ficha-producto__descuento">-{descuentoPct}%</span>
          ) : null}
        </div>

        {!disponible || (stockBajo && stockTotal !== undefined) ? (
          <div className="ui-ficha-producto__estado">
            {!disponible ? (
              <span className="ui-ficha-producto__disponibilidad ui-ficha-producto__disponibilidad--agotado">
                Agotado
              </span>
            ) : null}
            {disponible && stockBajo && stockTotal !== undefined ? (
              <span className="ui-ficha-producto__stock-bajo">Ultimas {stockTotal} unidades</span>
            ) : null}
          </div>
        ) : null}

        {disponible ? (
          <SelectorVariantes
            opciones={opciones}
            {...(stockTotal !== undefined ? { maximo: stockTotal } : {})}
            {...(onAgregar ? { onAgregar } : {})}
            {...(agregando !== undefined ? { agregando } : {})}
          />
        ) : null}

        {descripcion ? (
          <section className="ui-ficha-producto__descripcion">
            <h2 className="ui-ficha-producto__subtitulo">Descripcion</h2>
            <p>{descripcion}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
}
