import { describe, expect, it } from "vitest";

import {
  hayStock,
  movimientoPorAjuste,
  movimientosPorDevolucion,
  movimientosPorVenta,
  saldoDe,
} from "./movimientos";

const lineas = [
  { varianteId: "a", cantidad: 2 },
  { varianteId: "b", cantidad: 1 },
];

describe("movimientos de stock", () => {
  it("una venta resta, aunque la cantidad llegue negativa", () => {
    const movimientos = movimientosPorVenta([...lineas, { varianteId: "c", cantidad: -4 }], "p1");
    expect(movimientos.map((m) => m.delta)).toEqual([-2, -1, -4]);
    expect(movimientos.every((m) => m.motivo === "VENTA" && m.pedidoId === "p1")).toBe(true);
  });

  it("una devolucion suma y solo lleva nota si se da", () => {
    const [sinNota] = movimientosPorDevolucion(lineas, "p1");
    const [conNota] = movimientosPorDevolucion(lineas, "p1", "talla equivocada");
    expect(sinNota).toEqual({ varianteId: "a", delta: 2, motivo: "DEVOLUCION", pedidoId: "p1" });
    expect(conNota?.nota).toBe("talla equivocada");
  });

  it("vender y devolver deja el saldo como estaba", () => {
    const historial = [
      { delta: 10 },
      ...movimientosPorVenta(lineas, "p1"),
      ...movimientosPorDevolucion(lineas, "p1"),
    ];
    expect(saldoDe(historial)).toBe(10);
  });

  it("el ajuste registra solo la diferencia contada", () => {
    expect(movimientoPorAjuste("a", 7, 10, "conteo")).toEqual({
      varianteId: "a",
      delta: -3,
      motivo: "AJUSTE",
      nota: "conteo",
    });
    expect(movimientoPorAjuste("a", 10, 10, "conteo")).toBeNull();
  });

  it("hayStock exige al menos una unidad y no pasar de lo disponible", () => {
    expect(hayStock(5, 5)).toBe(true);
    expect(hayStock(5, 6)).toBe(false);
    expect(hayStock(5, 0)).toBe(false);
  });
});
