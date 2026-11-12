import { MONEDA } from "@appweb/core/formato";

import { Boton } from "../base/Boton";
import { FotoProducto } from "../catalogo/FotoProducto";
import { Precio } from "../catalogo/Precio";

import "./tarjeta-pack.css";

export interface PropsTarjetaPack {
  nombre: string;
  descripcion?: string | null;
  /** Foto de la primera prenda del pack. */
  imagenUrl: string;
  /** Prendas que trae en total. */
  unidades: number;
  /** Una linea por componente, ya redactada. */
  prendas: string[];
  /** Precio, precio suelto y ahorro llegan resueltos por @appweb/core. */
  precio: number;
  precioSuelto: number;
  ahorro: number;
  /** Enlace para pedirlo (WhatsApp). Sin el, la tarjeta no pinta boton. */
  hrefPedido?: string | null;
  /** `destacado`: la tarjeta oscura y ancha de la cabecera de la portada. */
  presentacion?: "normal" | "destacado";
}

/** Un pack: que trae, cuanto cuesta junto y cuanto se ahorra frente a comprar suelto. */
export function TarjetaPack({
  nombre,
  descripcion,
  imagenUrl,
  unidades,
  prendas,
  precio,
  precioSuelto,
  ahorro,
  hrefPedido,
  presentacion = "normal",
}: PropsTarjetaPack) {
  return (
    <article className={`ui-tarjeta-pack ui-tarjeta-pack--${presentacion}`}>
      <div className="ui-tarjeta-pack__foto">
        <FotoProducto
          src={imagenUrl}
          alt=""
          width={480}
          height={480}
          sizes="(min-width: 64rem) 320px, 50vw"
        />
        <span className="ui-tarjeta-pack__unidades">{unidades} prendas</span>
      </div>
      <div className="ui-tarjeta-pack__cuerpo">
        <h3 className="ui-tarjeta-pack__nombre">{nombre}</h3>
        {descripcion ? <p className="ui-tarjeta-pack__descripcion">{descripcion}</p> : null}
        <ul className="ui-tarjeta-pack__prendas">
          {prendas.map((prenda) => (
            <li key={prenda}>{prenda}</li>
          ))}
        </ul>
        <div className="ui-tarjeta-pack__pie">
          <Precio valor={precio} antes={ahorro > 0 ? precioSuelto : null} tamano="lg" />
          {ahorro > 0 ? (
            <span className="ui-tarjeta-pack__ahorro">Ahorras {MONEDA.format(ahorro)}</span>
          ) : null}
        </div>
        {hrefPedido ? (
          <Boton href={hrefPedido} externo anchoCompleto>
            Pedir por WhatsApp
          </Boton>
        ) : null}
      </div>
    </article>
  );
}
