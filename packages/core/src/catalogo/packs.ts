/**
 * Packs y combos: varias variantes vendidas juntas a un precio propio.
 *
 * Un pack no tiene stock propio. Alcanza para tantos packs como permita su
 * componente mas escaso, asi que vender un pack descuenta de cada variante y
 * el almacen sigue contando prendas, no cajas.
 *
 * Al venderse, cada componente entra al pedido como su propia linea con el
 * precio del pack repartido (`prorratearPack`): la suma de las lineas da
 * exactamente el precio del pack, y el margen sigue por variante.
 */

import { aCentimos } from "./compras";

export interface ComponentePack {
  varianteId: string;
  cantidad: number;
  /** Precio de la variante suelta: el del producto. */
  precioSuelto: number;
  stock: number;
  /** La variante y su producto estan activos. */
  activa: boolean;
  costo: number | null;
}

/** Cuantos packs completos se pueden armar hoy. */
export function stockDePack(componentes: ComponentePack[]): number {
  if (componentes.length === 0) return 0;
  return Math.min(
    ...componentes.map((c) => (c.activa && c.cantidad > 0 ? Math.floor(c.stock / c.cantidad) : 0)),
  );
}

/** Lo que costaria comprar todo por separado. */
export function precioSueltoDePack(componentes: ComponentePack[]): number {
  return aCentimos(componentes.reduce((suma, c) => suma + c.cantidad * c.precioSuelto, 0));
}

/** Costo del pack, o `null` si a algun componente le falta costo. */
export function costoDePack(componentes: ComponentePack[]): number | null {
  if (componentes.some((c) => c.costo === null)) return null;
  return aCentimos(componentes.reduce((suma, c) => suma + c.cantidad * (c.costo ?? 0), 0));
}

export type RechazoPack =
  | "sin_componentes"
  | "cantidad_invalida"
  | "componente_repetido"
  | "precio_invalido"
  | "precio_no_conviene";

const MENSAJES: Record<RechazoPack, string> = {
  sin_componentes: "Un pack necesita al menos dos prendas.",
  cantidad_invalida: "Cada prenda del pack necesita una cantidad entera mayor que cero.",
  componente_repetido: "Hay una talla y color repetidos: súmalos en una sola línea.",
  precio_invalido: "Escribe un precio mayor que cero.",
  precio_no_conviene: "El pack cuesta más que comprar las prendas por separado.",
};

export function mensajeDeRechazoPack(motivo: RechazoPack): string {
  return MENSAJES[motivo];
}

export function revisarPack(entrada: {
  precio: number;
  componentes: Pick<ComponentePack, "varianteId" | "cantidad" | "precioSuelto">[];
}): RechazoPack | null {
  const unidades = entrada.componentes.reduce((suma, c) => suma + c.cantidad, 0);
  if (entrada.componentes.length === 0 || unidades < 2) return "sin_componentes";
  const vistas = new Set<string>();
  for (const c of entrada.componentes) {
    if (!Number.isInteger(c.cantidad) || c.cantidad <= 0) return "cantidad_invalida";
    if (vistas.has(c.varianteId)) return "componente_repetido";
    vistas.add(c.varianteId);
  }
  if (!Number.isFinite(entrada.precio) || entrada.precio <= 0) return "precio_invalido";
  const suelto = entrada.componentes.reduce((s, c) => s + c.cantidad * c.precioSuelto, 0);
  if (entrada.precio > aCentimos(suelto)) return "precio_no_conviene";
  return null;
}

/**
 * Reparte el precio del pack entre sus componentes en proporcion a su precio
 * suelto. Devuelve el precio UNITARIO de cada linea; lo que sobra por redondeo
 * va a la ultima linea de una unidad, o se reparte en la ultima, para que la
 * suma sea exacta al centimo.
 */
export function prorratearPack(
  precio: number,
  componentes: Pick<ComponentePack, "varianteId" | "cantidad" | "precioSuelto">[],
): { varianteId: string; cantidad: number; precioUnitario: number }[] {
  const suelto = componentes.reduce((s, c) => s + c.cantidad * c.precioSuelto, 0);
  const lineas = componentes.map((c) => ({
    varianteId: c.varianteId,
    cantidad: c.cantidad,
    precioUnitario:
      suelto > 0
        ? aCentimos((precio * c.precioSuelto) / suelto)
        : aCentimos(precio / componentes.reduce((s, x) => s + x.cantidad, 0)),
  }));

  const centimos = (n: number) => Math.round(n * 100);
  let diferencia =
    centimos(precio) - lineas.reduce((s, l) => s + centimos(l.precioUnitario) * l.cantidad, 0);
  // Se corrige en lineas de una unidad (el ajuste cae entero) empezando por el final.
  for (let i = lineas.length - 1; i >= 0 && diferencia !== 0; i--) {
    const linea = lineas[i];
    if (linea === undefined) continue;
    const paso = Math.trunc(diferencia / linea.cantidad);
    if (paso === 0) continue;
    linea.precioUnitario = (centimos(linea.precioUnitario) + paso) / 100;
    diferencia -= paso * linea.cantidad;
  }
  return lineas;
}

/** Cuanto ahorra el cliente frente a comprar suelto. */
export function ahorroDePack(precio: number, precioSuelto: number): number {
  return Math.max(aCentimos(precioSuelto - precio), 0);
}
