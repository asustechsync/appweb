import { describe, expect, it } from "vitest";

import { acumular, serieEnTramos, seriesDelResumen, ventanaDe, ventanaDeFecha } from "./resumen";

describe("series acumuladas", () => {
  it("arranca en cero, suma los anteriores y los vacios quedan planos", () => {
    expect(acumular([300, 0, 0, 558, 0])).toEqual([0, 300, 300, 300, 858, 858]);
  });

  it("el eje es el dia entero y la linea se corta en ahora", () => {
    const desde = new Date(2026, 9, 21, 0, 0);
    const fin = new Date(2026, 9, 22, 0, 0);
    const s = seriesDelResumen(
      [
        { en: new Date(2026, 9, 21, 0, 30), total: 100 },
        { en: new Date(2026, 9, 21, 2, 30), total: 300 },
      ],
      [new Date(2026, 9, 21, 1, 30)],
      desde,
      fin,
      new Date(2026, 9, 21, 3, 15),
    );
    // Un tramo por hora y un 0 de arranque: a las 3:15 van 4 tramos.
    expect(s.ventas).toEqual([0, 100, 100, 400, 400]);
    expect(s.ticket).toEqual([0, 100, 100, 200, 200]);
    expect(s.clientesNuevos).toEqual([0, 0, 1, 1, 1]);
  });

  it("sin corte cubre el periodo entero", () => {
    const s = seriesDelResumen([], [], new Date(2026, 9, 20), new Date(2026, 9, 21));
    expect(s.ventas).toHaveLength(25);
  });
});

// Miercoles 21 oct 2026, 15:30.
const ahora = new Date(2026, 9, 21, 15, 30);

describe("ventanas del resumen", () => {
  it("el dia compara contra todo ayer", () => {
    const v = ventanaDe("dia", ahora);
    expect(v.desde).toEqual(new Date(2026, 9, 21));
    expect(v.previoDesde).toEqual(new Date(2026, 9, 20));
    expect(v.previoHasta).toEqual(new Date(2026, 9, 21));
    expect(v.etiquetaPrevio).toBe("Ayer");
    expect(v.fin).toEqual(new Date(2026, 9, 22));
  });

  it("la semana empieza el lunes y se compara contra toda la anterior", () => {
    const v = ventanaDe("semana", ahora);
    expect(v.desde).toEqual(new Date(2026, 9, 19));
    expect(v.previoDesde).toEqual(new Date(2026, 9, 12));
    expect(v.previoHasta).toEqual(new Date(2026, 9, 19));
  });

  it("un domingo cuenta como ultimo dia de la semana", () => {
    const domingo = new Date(2026, 9, 25, 10, 0);
    expect(ventanaDe("semana", domingo).desde).toEqual(new Date(2026, 9, 19));
  });

  it("el mes empieza el dia 1 y compara contra todo el anterior", () => {
    const v = ventanaDe("mes", ahora);
    expect(v.desde).toEqual(new Date(2026, 9, 1));
    expect(v.previoDesde).toEqual(new Date(2026, 8, 1));
    expect(v.previoHasta).toEqual(new Date(2026, 9, 1));
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
