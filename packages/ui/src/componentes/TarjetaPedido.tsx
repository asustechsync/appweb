import { Precio } from "./Precio";

import "./primitivos.css";

export interface ItemDePedido {
  nombreProducto: string;
  talla: string;
  color: string;
  precioUnitario: number;
  cantidad: number;
}

export interface PropsTarjetaPedido {
  items: ItemDePedido[];
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
}

const FORMATO = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** Recibo de un pedido ya cerrado: solo lectura, sin controles. */
export function TarjetaPedido({ items, subtotal, descuento, costoEnvio, total }: PropsTarjetaPedido) {
  return (
    <div className="ui-tarjeta-pedido">
      <ul className="ui-tarjeta-pedido__items">
        {items.map((item, indice) => (
          <li key={indice} className="ui-tarjeta-pedido__item">
            <div>
              <p className="ui-tarjeta-pedido__nombre">{item.nombreProducto}</p>
              <p className="ui-tarjeta-pedido__variante">
                Talla {item.talla} · {item.color} · x{item.cantidad}
              </p>
            </div>
            <Precio valor={item.precioUnitario * item.cantidad} tamano="sm" />
          </li>
        ))}
      </ul>

      <dl className="ui-tarjeta-pedido__cifras">
        <div>
          <dt>Subtotal</dt>
          <dd>{FORMATO.format(subtotal)}</dd>
        </div>
        {descuento > 0 ? (
          <div className="ui-tarjeta-pedido__descuento">
            <dt>Descuento</dt>
            <dd>−{FORMATO.format(descuento)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Envío</dt>
          <dd>{costoEnvio === 0 ? "Gratis" : FORMATO.format(costoEnvio)}</dd>
        </div>
      </dl>

      <div className="ui-tarjeta-pedido__total">
        <span>Total</span>
        <Precio valor={total} tamano="lg" />
      </div>
    </div>
  );
}
