/**
 * Ranking de clientes: quienes mas compraron y en que nivel van.
 *
 * Cuenta lo comprado de siempre (pedidos pagados en adelante), no el periodo
 * del resumen: los niveles tambien se ganan con todo el historial. El nivel y
 * lo que falta para el siguiente salen de `nivelPorCompras`, asi el panel dice
 * lo mismo que "Mi cuenta" y que el checkout.
 */

import { nivelPorCompras, textoQueFalta, type IdNivel, type Nivel } from "./niveles";

/** Lo que compro un cliente, tal como sale de agrupar sus pedidos. */
export interface CompraDeCliente {
  usuarioId: string;
  nombre: string;
  total: number;
  pedidos: number;
}

export type CriterioRanking = "gasto" | "pedidos";

export interface PuestoRanking {
  usuarioId: string;
  nombre: string;
  totalComprado: number;
  pedidos: number;
  nivel: { id: IdNivel; nombre: string };
  /** Avance hacia el siguiente nivel, de 0 a 100. 100 en el ultimo nivel. */
  progresoPct: number;
  /** Lo que falta para subir ("S/ 120 y 2 pedidos"), o `null` en el ultimo nivel. */
  faltaTexto: string | null;
}

/** Los `limite` primeros por `criterio`; a igualdad, el otro criterio y luego el nombre. */
export function armarRanking(
  compras: readonly CompraDeCliente[],
  niveles: readonly Nivel[],
  criterio: CriterioRanking,
  limite: number,
): PuestoRanking[] {
  const principal = (c: CompraDeCliente) => (criterio === "gasto" ? c.total : c.pedidos);
  const secundario = (c: CompraDeCliente) => (criterio === "gasto" ? c.pedidos : c.total);

  return [...compras]
    .sort(
      (a, b) =>
        principal(b) - principal(a) ||
        secundario(b) - secundario(a) ||
        a.nombre.localeCompare(b.nombre, "es"),
    )
    .slice(0, limite)
    .map((cliente) => {
      const estado = nivelPorCompras({ total: cliente.total, pedidos: cliente.pedidos }, niveles);
      return {
        usuarioId: cliente.usuarioId,
        nombre: cliente.nombre,
        totalComprado: estado.totalComprado,
        pedidos: estado.pedidos,
        nivel: { id: estado.nivel.id, nombre: estado.nivel.nombre },
        progresoPct: estado.progresoPct,
        faltaTexto: estado.siguiente ? textoQueFalta(estado.siguiente) : null,
      };
    });
}
