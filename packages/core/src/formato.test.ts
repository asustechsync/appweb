import { describe, expect, it } from "vitest";

import {
  cuandoFue,
  FECHA_HORA,
  FECHA_LARGA,
  HORA,
  MONEDA,
  mensajeDeFallo,
  numeroDesdeTexto,
} from "./formato";

describe("cuando fue", () => {
  const ahora = new Date("2026-10-23T15:00:00-05:00");

  it("hoy: solo la hora", () => {
    const fecha = new Date("2026-10-23T10:42:00-05:00");
    expect(cuandoFue(fecha, ahora)).toBe(HORA.format(fecha));
  });

  it("ayer: 'Ayer' y la hora, aunque en UTC ya sea hoy", () => {
    const anoche = new Date("2026-10-22T21:30:00-05:00");
    expect(cuandoFue(anoche, ahora)).toBe(`Ayer, ${HORA.format(anoche)}`);
  });

  it("antes: el dia, el mes y la hora", () => {
    const fecha = new Date("2026-10-16T09:00:00-05:00");
    expect(cuandoFue(fecha, ahora)).toMatch(/^16 oct, /);
  });
});

describe("formato", () => {
  it("escribe soles con dos decimales", () => {
    expect(MONEDA.format(29.9)).toContain("29.90");
  });

  it("usa la hora de Lima aunque en UTC ya sea otro dia", () => {
    const nocheEnLima = new Date("2026-10-18T22:00:00-05:00");
    expect(FECHA_LARGA.format(nocheEnLima)).toBe("18 de octubre de 2026");
    expect(FECHA_HORA.format(nocheEnLima)).toContain("18");
  });

  it("lee montos con coma o punto", () => {
    expect(numeroDesdeTexto("29,90")).toBe(29.9);
    expect(numeroDesdeTexto(" 12.5 ")).toBe(12.5);
    expect(numeroDesdeTexto("")).toBeNaN();
  });

  it("saca el mensaje de un error", () => {
    expect(mensajeDeFallo(new Error("Sin stock"))).toBe("Sin stock");
    expect(mensajeDeFallo("raro")).toBe("No se pudo completar la acción.");
  });
});
