import { describe, expect, it } from "vitest";

import { aIso, desdeIso, moverMes, semanasDelMes } from "./calendario";

describe("fechas ISO", () => {
  it("va y vuelve sin cambiar de dia", () => {
    expect(aIso(new Date(2026, 9, 21, 23, 59))).toBe("2026-10-21");
    expect(desdeIso("2026-10-21")).toEqual(new Date(2026, 9, 21));
  });

  it("rechaza lo que no es una fecha real", () => {
    expect(desdeIso("2026-02-31")).toBeNull();
    expect(desdeIso("2026-13-01")).toBeNull();
    expect(desdeIso("21/10/2026")).toBeNull();
    expect(desdeIso("")).toBeNull();
  });
});

describe("cuadricula del mes", () => {
  it("octubre 2026 empieza en jueves y tiene 5 semanas", () => {
    const semanas = semanasDelMes(2026, 10);
    expect(semanas).toHaveLength(5);
    expect(semanas[0]).toEqual([null, null, null, 1, 2, 3, 4]);
    expect(semanas.at(-1)).toEqual([26, 27, 28, 29, 30, 31, null]);
  });

  it("todas las filas tienen siete celdas y los dias van en orden", () => {
    for (const [anio, mes] of [
      [2026, 2],
      [2024, 2],
      [2026, 3],
      [2026, 11],
    ] as const) {
      const semanas = semanasDelMes(anio, mes);
      expect(semanas.every((s) => s.length === 7)).toBe(true);
      const dias = semanas.flat().filter((d): d is number => d !== null);
      expect(dias).toEqual(Array.from({ length: dias.length }, (_, i) => i + 1));
      expect(dias.length).toBe(new Date(anio, mes, 0).getDate());
    }
  });

  it("un mes que empieza en lunes no lleva hueco inicial", () => {
    // Junio 2026 empieza en lunes.
    expect(semanasDelMes(2026, 6)[0]?.[0]).toBe(1);
  });

  it("cambia de año al mover el mes", () => {
    expect(moverMes(2026, 12, 1)).toEqual({ anio: 2027, mes: 1 });
    expect(moverMes(2026, 1, -1)).toEqual({ anio: 2025, mes: 12 });
  });
});
