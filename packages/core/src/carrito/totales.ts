/**
 * Totales del carrito y del pedido.
 *
 * Esta es LA funcion: la misma que pinta el resumen del carrito, la que cierra
 * el pedido en el servidor y la que el panel usa para mostrar una venta. Un
 * solo sitio donde equivocarse, un solo sitio donde arreglarlo.
 *
 * No conoce React, ni Prisma, ni el carrito guardado: recibe lineas y devuelve
 * cifras. Por eso la app movil la usara sin cambiar una linea.
 */

export interface LineaCarrito {
  varianteId: string;
  precioUnitario: number;
  cantidad: number;
  /** Unidades disponibles ahora. Sirve para avisar antes de cobrar. */
  stock: number;
}

export interface MetodoEnvioCalculo {
  costo: number;
  /** Subtotal desde el que el envio sale gratis. `null` si nunca. */
  gratisDesde: number | null;
}

export interface TotalesCompra {
  unidades: number;
  subtotal: number;
  descuento: number;
  /** `null` mientras no se haya elegido metodo de envio. */
  costoEnvio: number | null;
  total: number;
  /** Cuanto falta para el envio gratis. `null` si ya lo tiene o no aplica. */
  faltaEnvioGratis: number | null;
  /** Lineas que piden mas unidades de las que hay. */
  lineasSinStock: string[];
}

/** Redondea a dos decimales evitando el error binario de coma flotante. */
export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularTotales(
  lineas: LineaCarrito[],
  opciones: {
    descuento?: number;
    metodoEnvio?: MetodoEnvioCalculo | null;
  } = {},
): TotalesCompra {
  const { descuento = 0, metodoEnvio = null } = opciones;

  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  const subtotal = redondear(
    lineas.reduce((suma, linea) => suma + linea.precioUnitario * linea.cantidad, 0),
  );

  // El descuento nunca puede dejar el subtotal en negativo.
  const descuentoAplicado = redondear(Math.min(Math.max(descuento, 0), subtotal));
  const base = redondear(subtotal - descuentoAplicado);

  let costoEnvio: number | null = null;
  let faltaEnvioGratis: number | null = null;

  if (metodoEnvio) {
    const tieneGratis =
      metodoEnvio.gratisDesde !== null && base >= metodoEnvio.gratisDesde;
    costoEnvio = tieneGratis ? 0 : redondear(metodoEnvio.costo);

    if (metodoEnvio.gratisDesde !== null && !tieneGratis) {
      faltaEnvioGratis = redondear(metodoEnvio.gratisDesde - base);
    }
  }

  const lineasSinStock = lineas
    .filter((linea) => linea.cantidad > linea.stock)
    .map((linea) => linea.varianteId);

  return {
    unidades,
    subtotal,
    descuento: descuentoAplicado,
    costoEnvio,
    total: redondear(base + (costoEnvio ?? 0)),
    faltaEnvioGratis,
    lineasSinStock,
  };
}
