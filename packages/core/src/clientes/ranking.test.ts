import { describe, expect, it } from "vitest";

import { NIVELES_INICIALES } from "./niveles";
import { armarRanking, type CompraDeCliente } from "./ranking";

const COMPRAS: CompraDeCliente[] = [
  { usuarioId: "a", nombre: "Ana", total: 1600, pedidos: 12 },
  { usuarioId: "b", nombre: "Beto", total: 700, pedidos: 20 },
  { usuarioId: "c", nombre: "Carla", total: 100, pedidos: 1 },
];

describe("armarRanking", () => {
  it("ordena por gasto y marca el nivel de cada cliente", () => {
    const ranking = armarRanking(COMPRAS, NIVELES_INICIALES, "gasto", 5);
    expect(ranking.map((p) => p.usuarioId)).toEqual(["a", "b", "c"]);
    expect(ranking.map((p) => p.nivel.id)).toEqual(["PLATINO", "PLATA", "BASICO"]);
  });

  it("ordena por pedidos cuando se pide", () => {
    const ranking = armarRanking(COMPRAS, NIVELES_INICIALES, "pedidos", 5);
    expect(ranking.map((p) => p.usuarioId)).toEqual(["b", "a", "c"]);
  });

  it("respeta el limite", () => {
    expect(armarRanking(COMPRAS, NIVELES_INICIALES, "gasto", 2)).toHaveLength(2);
  });

  it("el ultimo nivel no tiene siguiente: progreso completo y nada que falte", () => {
    const [primero] = armarRanking(COMPRAS, NIVELES_INICIALES, "gasto", 1);
    expect(primero?.progresoPct).toBe(100);
    expect(primero?.faltaTexto).toBeNull();
  });

  it("dice lo que falta para el siguiente nivel", () => {
    const [, plata] = armarRanking(COMPRAS, NIVELES_INICIALES, "gasto", 2);
    expect(plata?.faltaTexto).toContain("S/");
  });

  it("a igualdad desempata por el otro criterio y luego por nombre", () => {
    const empate: CompraDeCliente[] = [
      { usuarioId: "x", nombre: "Zoe", total: 500, pedidos: 4 },
      { usuarioId: "y", nombre: "Ada", total: 500, pedidos: 4 },
      { usuarioId: "z", nombre: "Mia", total: 500, pedidos: 6 },
    ];
    const ranking = armarRanking(empate, NIVELES_INICIALES, "gasto", 3);
    expect(ranking.map((p) => p.usuarioId)).toEqual(["z", "y", "x"]);
  });
});
