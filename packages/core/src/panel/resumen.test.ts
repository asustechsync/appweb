import { describe, expect, it } from "vitest";

import { serieEnTramos, ventanaDe, ventanaDeFecha } from "./resumen";

// Miercoles 21 oct 2026, 15:30.
const ahora = new Date(2026, 9, 21, 15, 30);

describe("ventanas del resumen", () => {
  it("el dia compara contra el mismo tramo de ayer", () => {
    const v = ventanaDe("dia", ahora);
    expect(v.desde).toEqual(new Date(2026, 9, 21));
    expect(v.previoDesde).toEqual(new Date(2026, 9, 20));
    expect(v.previoHasta.getTime() - v.previoDesde.getTime()).toBe(
      ahora.getTime() - v.desde.getTime(),
    );
  });

  it("la semana empieza el lunes y se compara por el mismo tramo", () => {
    const v = ventanaDe("semana", ahora);
    expect(v.desde).toEqual(new Date(2026, 9, 19));
    expect(v.previoDesde).toEqual(new Date(2026, 9, 12));
    expect(v.previoHasta.getTime() - v.previoDesde.getTime()).toBe(
      ahora.getTime() - v.desde.getTime(),
    );
  });

  it("un domingo cuenta como ultimo dia de la semana", () => {
    const domingo = new Date(2026, 9, 25, 10, 0);
    expect(ventanaDe("semana", domingo).desde).toEqual(new Date(2026, 9, 19));
  });

  it("el mes empieza el dia 1 y compara contra el mismo tramo del anterior", () => {
    const v = ventanaDe("mes", ahora);
    expect(v.desde).toEqual(new Date(2026, 9, 1));
    expect(v.previoDesde).toEqual(new Date(2026, 8, 1));
    expect(v.previoHasta.getTime() - v.previoDesde.getTime()).toBe(
      ahora.getTime() - v.desde.getTime(),
    );
  });

  it("el tramo previo no se pasa a este mes cuando el anterior es mas corto", () => {
    const v = ventanaDe("mes", new Date(2026, 2, 31, 12, 0));
    expect(v.previoHasta.getTime()).toBeLessThanOrEqual(v.desde.getTime());
  });
});

describe("ventana de un dia concreto", () => {
  it("un dia pasado se mide entero contra el anterior", () => {
    const v = ventanaDeFecha("2026-10-15", ahora);
    expect(v.desde).toEqual(new Date(2026, 9, 15));
    expect(v.hasta).toEqual(new Date(2026, 9, 16));
    expect(v.previoDesde).toEqual(new Date(2026, 9, 14));
    expect(v.previoHasta).toEqual(new Date(2026, 9, 15));
  });

  it("hoy, o una fecha futura o invalida, se comporta como el periodo dia", () => {
    for (const iso of ["2026-10-21", "2027-01-01", "2026-02-31", "basura"]) {
      const v = ventanaDeFecha(iso, ahora);
      expect(v.desde).toEqual(new Date(2026, 9, 21));
      expect(v.hasta).toBeNull();
    }
  });
});

describe("serie en tramos", () => {
  const desde = new Date(2026, 9, 21, 0, 0);
  const hasta = new Date(2026, 9, 21, 8, 0);

  it("suma cada registro en su tramo", () => {
    const serie = serieEnTramos(
      [
        { en: new Date(2026, 9, 21, 0, 30), valor: 10 },
        { en: new Date(2026, 9, 21, 0, 45), valor: 5 },
        { en: new Date(2026, 9, 21, 7, 59), valor: 2 },
      ],
      desde,
      hasta,
      8,
    );
    expect(serie).toEqual([15, 0, 0, 0, 0, 0, 0, 2]);
  });

  it("ignora lo que cae fuera de la ventana", () => {
    expect(serieEnTramos([{ en: hasta, valor: 9 }], desde, hasta, 4)).toEqual([0, 0, 0, 0]);
  });
});
