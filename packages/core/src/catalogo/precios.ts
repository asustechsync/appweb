/**
 * Precio final, descuento y disponibilidad de un producto.
 *
 * Ninguna pagina calcula esto por su cuenta: si el descuento se calculara en
 * la ficha y otra vez en la tarjeta del listado, tarde o temprano mostrarian
 * cifras distintas para el mismo producto.
 */

import { redondear } from "../carrito/totales";

export interface PrecioProducto {
  precio: number;
  /** Precio tachado. `null` si no esta en oferta. */
  precioLista: number | null;
}

export interface PrecioResuelto {
  precio: number;
  precioLista: number | null;
  enOferta: boolean;
  /** Porcentaje entero de descuento. `null` si no hay oferta. */
  descuentoPct: number | null;
  ahorro: number;
}

export function resolverPrecio(entrada: PrecioProducto): PrecioResuelto {
  const { precio, precioLista } = entrada;

  const enOferta = precioLista !== null && precioLista > precio;

  if (!enOferta || precioLista === null) {
    return { precio, precioLista: null, enOferta: false, descuentoPct: null, ahorro: 0 };
  }

  const ahorro = redondear(precioLista - precio);

  return {
    precio,
    precioLista,
    enOferta: true,
    descuentoPct: Math.round((ahorro / precioLista) * 100),
    ahorro,
  };
}

export interface VarianteDisponible {
  talla: string;
  color: string;
  stock: number;
  activa: boolean;
}

export interface Disponibilidad {
  hayStock: boolean;
  stockTotal: number;
  tallas: string[];
  colores: string[];
  /** Avisa "ultimas N unidades" por debajo de este umbral. */
  stockBajo: boolean;
}

export function resolverDisponibilidad(
  variantes: VarianteDisponible[],
  umbralBajo = 5,
): Disponibilidad {
  const activas = variantes.filter((v) => v.activa);
  const conStock = activas.filter((v) => v.stock > 0);
  const stockTotal = activas.reduce((suma, v) => suma + v.stock, 0);

  return {
    hayStock: stockTotal > 0,
    stockTotal,
    tallas: [...new Set(conStock.map((v) => v.talla))],
    colores: [...new Set(conStock.map((v) => v.color))],
    stockBajo: stockTotal > 0 && stockTotal <= umbralBajo,
  };
}
