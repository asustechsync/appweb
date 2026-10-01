import Image from "next/image";

import "./primitivos.css";

const FORMATO = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export interface ArticuloResumen {
  id: string;
  nombre: string;
  imagenUrl: string;
  talla: string;
  color: string;
  cantidad: number;
  /** Total de la linea, ya calculado fuera. */
  total: number;
}

export interface PropsArticulosResumen {
  articulos: ArticuloResumen[];
}

/** Lista compacta de lo que se compra, para el resumen del checkout. */
export function ArticulosResumen({ articulos }: PropsArticulosResumen) {
  return (
    <ul className="ui-articulos-resumen" aria-label="Productos del pedido">
      {articulos.map((articulo) => (
        <li key={articulo.id} className="ui-articulos-resumen__item">
          <span className="ui-articulos-resumen__imagen">
            <Image src={articulo.imagenUrl} alt="" width={112} height={112} sizes="56px" />
            <span className="ui-articulos-resumen__cantidad">
              <span className="ui-solo-lectores">Cantidad: </span>
              {articulo.cantidad}
            </span>
          </span>
          <span className="ui-articulos-resumen__datos">
            <span className="ui-articulos-resumen__nombre">{articulo.nombre}</span>
            <span className="ui-articulos-resumen__variante">
              {articulo.color} · Talla {articulo.talla}
            </span>
          </span>
          <span className="ui-articulos-resumen__total">{FORMATO.format(articulo.total)}</span>
        </li>
      ))}
    </ul>
  );
}
