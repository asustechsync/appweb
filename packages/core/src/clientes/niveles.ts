/**
 * Niveles de recompensa: Básico, Bronce, Plata, Oro y Platino segun lo que
 * el cliente ya compro (pedidos pagados en adelante, ver `ESTADOS_VENTA`).
 *
 * Cada nivel pide dos cosas a la vez: un monto comprado y una cantidad de
 * pedidos. Asi una sola compra grande no sube a nadie a lo mas alto: el
 * programa premia volver a comprar. Básico es el de toda cuenta nueva.
 *
 * Los niveles son cinco filas de la tabla `niveles`: el panel edita montos,
 * pedidos, descuento y texto, pero no crea ni borra niveles. El nivel de cada
 * cliente no se guarda: se calcula con sus pedidos contra esas filas cada
 * vez, asi la web, el panel y la app movil ven lo mismo.
 *
 * Los niveles no dan envio gratis: el descuento sale del margen de una venta
 * que si ocurre, y los obsequios van siempre dentro de un pedido pagado.
 */

import { MONEDA } from "../formato";

export const IDS_NIVEL = ["BASICO", "BRONCE", "PLATA", "ORO", "PLATINO"] as const;
export type IdNivel = (typeof IDS_NIVEL)[number];

export interface Nivel {
  id: IdNivel;
  nombre: string;
  /** Desde cuanto comprado (S/) se alcanza. */
  desde: number;
  /** Cuantos pedidos hacen falta, ademas del monto. */
  pedidosMinimos: number;
  /** Descuento automatico en cada compra. No se suma al cupon: gana el mayor. */
  descuentoPct: number;
  /** Lo que ve el cliente: el descuento y el obsequio del nivel. */
  beneficio: string;
}

/** Lo que compro un cliente: el monto y cuantos pedidos. */
export interface Compras {
  total: number;
  pedidos: number;
}

/**
 * Valores con los que arranca la tabla `niveles` (la migracion los inserta).
 * Fuera de las pruebas no se leen: los vigentes salen de la base.
 */
export const NIVELES_INICIALES: readonly Nivel[] = [
  {
    id: "BASICO",
    nombre: "Básico",
    desde: 0,
    pedidosMinimos: 0,
    descuentoPct: 0,
    beneficio: "Tus compras suman para subir de nivel.",
  },
  {
    id: "BRONCE",
    nombre: "Bronce",
    desde: 300,
    pedidosMinimos: 3,
    descuentoPct: 3,
    beneficio: "3% en cada compra y un par de medias de regalo al subir de nivel.",
  },
  {
    id: "PLATA",
    nombre: "Plata",
    desde: 550,
    pedidosMinimos: 5,
    descuentoPct: 5,
    beneficio: "5% en cada compra y un regalo de cumpleaños con tu compra.",
  },
  {
    id: "ORO",
    nombre: "Oro",
    desde: 950,
    pedidosMinimos: 8,
    descuentoPct: 7,
    beneficio: "7% en cada compra y un par de medias cada 3 meses con tu compra.",
  },
  {
    id: "PLATINO",
    nombre: "Platino",
    desde: 1500,
    pedidosMinimos: 12,
    descuentoPct: 10,
    beneficio: "10% en cada compra y un boxer de regalo en tu cumpleaños.",
  },
];

export interface EstadoNivel {
  nivel: Nivel;
  totalComprado: number;
  pedidos: number;
  /** El que sigue y cuanto falta de cada requisito. `null` en el ultimo nivel. */
  siguiente: { nivel: Nivel; falta: number; faltanPedidos: number } | null;
  /** Avance hacia el siguiente nivel, de 0 a 100: el del requisito mas atrasado. */
  progresoPct: number;
}

/** `niveles` en orden, de Básico a Platino (como los devuelve la base). */
export function nivelPorCompras(compras: Compras, niveles: readonly Nivel[]): EstadoNivel {
  const comprado = Math.max(0, compras.total);
  const pedidos = Math.max(0, Math.floor(compras.pedidos));
  const indice = indiceDeNivel({ total: comprado, pedidos }, niveles);

  const nivel = niveles[indice] as Nivel;
  const siguienteNivel = niveles[indice + 1];
  if (!siguienteNivel) {
    return { nivel, totalComprado: comprado, pedidos, siguiente: null, progresoPct: 100 };
  }

  const avanceMonto = avance(comprado, nivel.desde, siguienteNivel.desde);
  const avancePedidos = avance(pedidos, nivel.pedidosMinimos, siguienteNivel.pedidosMinimos);
  return {
    nivel,
    totalComprado: comprado,
    pedidos,
    siguiente: {
      nivel: siguienteNivel,
      falta: Math.max(0, Math.round((siguienteNivel.desde - comprado) * 100) / 100),
      faltanPedidos: Math.max(0, siguienteNivel.pedidosMinimos - pedidos),
    },
    progresoPct: Math.min(avanceMonto, avancePedidos),
  };
}

/**
 * Lo que le falta al cliente para el siguiente nivel, en una frase:
 * "S/ 120 y 2 pedidos", "1 pedido" o "S/ 45,50". Lo usan "Mi cuenta" y el
 * panel, asi los dos lo dicen igual.
 */
export function textoQueFalta(siguiente: NonNullable<EstadoNivel["siguiente"]>): string {
  const partes: string[] = [];
  if (siguiente.falta > 0) partes.push(MONEDA.format(siguiente.falta));
  if (siguiente.faltanPedidos > 0) {
    partes.push(
      `${siguiente.faltanPedidos} ${siguiente.faltanPedidos === 1 ? "pedido" : "pedidos"}`,
    );
  }
  return partes.join(" y ");
}

/** De 0 a 100: cuanto se recorrio entre `desde` y `hasta`. */
function avance(valor: number, desde: number, hasta: number): number {
  if (hasta <= desde) return 100;
  return Math.min(100, Math.max(0, Math.floor(((valor - desde) / (hasta - desde)) * 100)));
}

/** El nivel mas alto cuyos dos requisitos se cumplen. */
function indiceDeNivel(compras: Compras, niveles: readonly Nivel[]): number {
  let indice = 0;
  niveles.forEach((nivel, i) => {
    if (compras.total >= nivel.desde && compras.pedidos >= nivel.pedidosMinimos) indice = i;
  });
  return indice;
}

/** Tope del texto de beneficio: son dos lineas en "Mi cuenta". */
export const MAX_BENEFICIO = 160;

/**
 * Lo que el panel no deja guardar. Devuelve el motivo, o `null` si los
 * niveles son validos. Se revisa en el panel (para avisar mientras se edita)
 * y otra vez en la API antes de escribir.
 */
export function revisarNiveles(niveles: readonly Nivel[]): string | null {
  if (
    niveles.length !== IDS_NIVEL.length ||
    niveles.some((nivel, i) => nivel.id !== IDS_NIVEL[i])
  ) {
    return "Los niveles son Básico, Bronce, Plata, Oro y Platino, en ese orden.";
  }

  for (const [i, nivel] of niveles.entries()) {
    if (nivel.nombre.trim() === "") return "Cada nivel necesita un nombre.";
    if (nivel.beneficio.trim() === "") return `Escribe el beneficio de ${nivel.nombre}.`;
    if (nivel.beneficio.length > MAX_BENEFICIO) {
      return `El beneficio de ${nivel.nombre} no puede pasar de ${MAX_BENEFICIO} caracteres.`;
    }
    if (
      !Number.isInteger(nivel.descuentoPct) ||
      nivel.descuentoPct < 0 ||
      nivel.descuentoPct > 100
    ) {
      return `El descuento de ${nivel.nombre} debe ser un número entero entre 0 y 100.`;
    }
    if (!Number.isFinite(nivel.desde) || nivel.desde < 0) {
      return `El monto de ${nivel.nombre} no puede ser negativo.`;
    }
    if (!Number.isInteger(nivel.pedidosMinimos) || nivel.pedidosMinimos < 0) {
      return `Los pedidos de ${nivel.nombre} deben ser un número entero desde 0.`;
    }

    const anterior = niveles[i - 1];
    if (anterior === undefined) {
      if (nivel.desde !== 0 || nivel.pedidosMinimos !== 0) {
        return `${nivel.nombre} es el nivel de toda cuenta nueva: empieza en S/ 0 y 0 pedidos.`;
      }
      continue;
    }
    if (nivel.desde <= anterior.desde) {
      return `${nivel.nombre} debe pedir más monto que ${anterior.nombre}.`;
    }
    if (nivel.pedidosMinimos < anterior.pedidosMinimos) {
      return `${nivel.nombre} no puede pedir menos pedidos que ${anterior.nombre}.`;
    }
    if (nivel.descuentoPct < anterior.descuentoPct) {
      return `${nivel.nombre} no puede descontar menos que ${anterior.nombre}.`;
    }
  }

  return null;
}

/** Cuantos clientes hay en cada nivel, a partir de lo que compro cada uno. */
export function clientesPorNivel(
  compras: readonly Compras[],
  niveles: readonly Nivel[],
): Record<IdNivel, number> {
  const cuenta: Record<IdNivel, number> = { BASICO: 0, BRONCE: 0, PLATA: 0, ORO: 0, PLATINO: 0 };
  for (const cliente of compras) {
    const nivel = niveles[indiceDeNivel(cliente, niveles)];
    if (nivel) cuenta[nivel.id] += 1;
  }
  return cuenta;
}

/**
 * A cuantos clientes mueve un cambio de requisitos: los que subirian y los
 * que bajarian de nivel si se guardan `propuestos` en vez de `actuales`.
 */
export function impactoDeNiveles(
  compras: readonly Compras[],
  actuales: readonly Nivel[],
  propuestos: readonly Nivel[],
): { suben: number; bajan: number } {
  let suben = 0;
  let bajan = 0;
  for (const cliente of compras) {
    const antes = indiceDeNivel(cliente, actuales);
    const despues = indiceDeNivel(cliente, propuestos);
    if (despues > antes) suben += 1;
    else if (despues < antes) bajan += 1;
  }
  return { suben, bajan };
}
