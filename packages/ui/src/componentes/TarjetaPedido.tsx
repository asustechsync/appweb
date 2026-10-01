import Image from "next/image";

import { Precio } from "./Precio";

import "./primitivos.css";

export interface ItemDePedido {
  nombreProducto: string;
  talla: string;
  color: string;
  precioUnitario: number;
  cantidad: number;
  /** Miniatura del producto. Sin ella la linea se pinta solo con texto. */
  imagenUrl?: string | null;
}

export interface PropsTarjetaPedido {
  items: ItemDePedido[];
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  /** Titulo sobre la lista: "Resumen del pedido". */
  titulo?: string;
}

const FORMATO = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** Recibo de un pedido ya cerrado: solo lectura, sin controles. */
export function TarjetaPedido({
  items,
  subtotal,
  descuento,
  costoEnvio,
  total,
  titulo,
}: PropsTarjetaPedido) {
  return (
    <div className="ui-tarjeta-pedido">
      {titulo ? <h2 className="ui-tarjeta-pedido__titulo">{titulo}</h2> : null}

      <ul className="ui-tarjeta-pedido__items">
        {items.map((item, indice) => (
          <li key={indice} className="ui-tarjeta-pedido__item">
            {item.imagenUrl ? (
              <span className="ui-tarjeta-pedido__imagen">
                <Image src={item.imagenUrl} alt="" width={112} height={112} sizes="56px" />
              </span>
            ) : null}
            <div className="ui-tarjeta-pedido__datos">
              <p className="ui-tarjeta-pedido__nombre">{item.nombreProducto}</p>
              <p className="ui-tarjeta-pedido__variante">
                {item.color} · Talla {item.talla}
              </p>
              <p className="ui-tarjeta-pedido__variante">
                {item.cantidad} × {FORMATO.format(item.precioUnitario)}
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
