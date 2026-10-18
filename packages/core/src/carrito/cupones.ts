/**
 * Cupones de descuento.
 *
 * Las reglas de cada cupon viven en la tabla `cupones` (el panel las edita);
 * aqui se decide si un cupon vale para una compra y cuanto descuenta. La web,
 * el checkout del servidor y la app movil preguntan aqui, asi que un cupon
 * vencido se rechaza igual en todos lados.
 */

/** Lo que el carrito necesita saber de un cupon ya aceptado. */
export interface Cupon {
  codigo: string;
  /** Porcentaje del subtotal, de 1 a 100. */
  porcentaje: number;
}

/** Un cupon tal como esta en la base. */
export interface ReglaCupon extends Cupon {
  activo: boolean;
  /** Subtotal minimo para usarlo. `null` = sin minimo. */
  minimoCompra: number | null;
  /** Tope de usos. `null` = sin tope. */
  usosMaximos: number | null;
  usos: number;
  desde: Date | null;
  hasta: Date | null;
}

export type RechazoCupon =
  | "no_existe"
  | "inactivo"
  | "aun_no_empieza"
  | "vencido"
  | "agotado"
  | "minimo_no_alcanzado";

const MONEDA = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export function mensajeDeRechazoCupon(motivo: RechazoCupon, regla?: ReglaCupon | null): string {
  switch (motivo) {
    case "no_existe":
    case "inactivo":
      return "El código promocional no es válido.";
    case "aun_no_empieza":
      return "Este código todavía no está vigente.";
    case "vencido":
      return "Este código ya venció.";
    case "agotado":
      return "Este código ya alcanzó su límite de usos.";
    case "minimo_no_alcanzado":
      return regla?.minimoCompra != null
        ? `Este código es para compras desde ${MONEDA.format(regla.minimoCompra)}.`
        : "Tu compra no alcanza el mínimo de este código.";
  }
}

/** " promo10 " -> "PROMO10": asi se guarda y asi se busca. */
export function normalizarCodigo(codigo: string | null | undefined): string {
  return (codigo ?? "").trim().toUpperCase();
}

/**
 * ¿Vale este cupon para esta compra? `regla` es lo que se encontro en la base
 * por su codigo (`null` si no hay ninguno).
 */
export function revisarCupon(
  regla: ReglaCupon | null,
  compra: { subtotal: number; ahora?: Date },
): { cupon: Cupon } | { rechazo: RechazoCupon } {
  if (regla === null) return { rechazo: "no_existe" };
  if (!regla.activo) return { rechazo: "inactivo" };

  const ahora = compra.ahora ?? new Date();
  if (regla.desde !== null && ahora < regla.desde) return { rechazo: "aun_no_empieza" };
  if (regla.hasta !== null && ahora > regla.hasta) return { rechazo: "vencido" };
  if (regla.usosMaximos !== null && regla.usos >= regla.usosMaximos) return { rechazo: "agotado" };
  if (regla.minimoCompra !== null && compra.subtotal < regla.minimoCompra) {
    return { rechazo: "minimo_no_alcanzado" };
  }

  return { cupon: { codigo: regla.codigo, porcentaje: regla.porcentaje } };
}

/** Cuanto descuenta el cupon sobre un subtotal. 0 si no hay cupon. */
export function descuentoDeCupon(subtotal: number, cupon: Cupon | null): number {
  if (!cupon) return 0;
  return Math.round(((subtotal * cupon.porcentaje) / 100 + Number.EPSILON) * 100) / 100;
}
