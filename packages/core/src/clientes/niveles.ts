/**
 * Niveles de recompensa: Bronce, Plata y Oro segun lo que el cliente ya
 * compro (pedidos pagados en adelante, ver `ESTADOS_VENTA`).
 *
 * Sin tabla: el nivel se calcula desde los pedidos cada vez. Si mañana hace
 * falta guardarlo (puntos, historial de niveles), los pedidos siguen ahi y se
 * puede reconstruir — la pregunta de las tres meses de CLAUDE.md.
 *
 * Los umbrales y beneficios son decision del negocio: se cambian aqui y lo
 * toman la web, el panel y la app movil a la vez.
 */

export interface Nivel {
  id: "BRONCE" | "PLATA" | "ORO";
  nombre: string;
  /** Desde cuanto comprado (S/) se alcanza. */
  desde: number;
  /** Descuento automatico en cada compra. No se suma al cupon: gana el mayor. */
  descuentoPct: number;
  beneficio: string;
}

export const NIVELES: readonly Nivel[] = [
  {
    id: "BRONCE",
    nombre: "Bronce",
    desde: 0,
    descuentoPct: 0,
    beneficio: "Tus compras suman para subir de nivel.",
  },
  {
    id: "PLATA",
    nombre: "Plata",
    desde: 300,
    descuentoPct: 5,
    beneficio: "5% de descuento automático en cada compra.",
  },
  {
    id: "ORO",
    nombre: "Oro",
    desde: 800,
    descuentoPct: 10,
    beneficio: "10% de descuento automático en cada compra.",
  },
];

export interface EstadoNivel {
  nivel: Nivel;
  totalComprado: number;
  /** El que sigue y cuanto falta. `null` en el ultimo nivel. */
  siguiente: { nivel: Nivel; falta: number } | null;
  /** Avance hacia el siguiente nivel, de 0 a 100. 100 en el ultimo. */
  progresoPct: number;
}

export function nivelPorCompras(totalComprado: number): EstadoNivel {
  const comprado = Math.max(0, totalComprado);
  let indice = 0;
  NIVELES.forEach((nivel, i) => {
    if (comprado >= nivel.desde) indice = i;
  });

  const nivel = NIVELES[indice] as Nivel;
  const siguienteNivel = NIVELES[indice + 1];
  if (!siguienteNivel) return { nivel, totalComprado: comprado, siguiente: null, progresoPct: 100 };

  const tramo = siguienteNivel.desde - nivel.desde;
  return {
    nivel,
    totalComprado: comprado,
    siguiente: {
      nivel: siguienteNivel,
      falta: Math.round((siguienteNivel.desde - comprado) * 100) / 100,
    },
    progresoPct: Math.floor(((comprado - nivel.desde) / tramo) * 100),
  };
}
