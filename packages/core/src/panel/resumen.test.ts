import { describe, expect, it } from "vitest";

import {
  acumular,
  marcasDelEje,
  repartoPorMedio,
  serieEnTramos,
  seriesDelResumen,
  ventanaDe,
  ventanaDeFecha,
} from "./resumen";

describe("reparto por medio de pago", () => {
  it("ordena de mas a menos plata y los porcentajes suman 100", () => {
    const reparto = repartoPorMedio([
      { medio: "PLIN", monto: 100, pagos: 1 },
      { medio: "YAPE", monto: 100, pagos: 2 },
      { medio: "TARJETA", monto: 100, pagos: 1 },
      { medio: "TRANSFERENCIA", monto: 0, pagos: 0 },
    ]);
    expect(reparto.reduce((suma, r) => suma + r.porcentaje, 0)).toBe(100);
  });

  it("los medios sin plata se quedan al final en 0%", () => {
    const reparto = repartoPorMedio([
      { medio: "TRANSFERENCIA", monto: 0, pagos: 0 },
      { medio: "YAPE", monto: 50, pagos: 1 },
    ]);
    expect(reparto.map((r) => [r.medio, r.porcentaje])).toEqual([
      ["YAPE", 100],
      ["TRANSFERENCIA", 0],
    ]);
  });

  it("el mayor va primero", () => {
    const reparto = repartoPorMedio([
      { medio: "PLIN", monto: 30, pagos: 1 },
      { medio: "YAPE", monto: 70, pagos: 3 },
    ]);
    expect(reparto[0]).toEqual({ medio: "YAPE", monto: 70, pagos: 3, porcentaje: 70 });
  });

  it("sin pagos todos quedan en 0%", () => {
    const reparto = repartoPorMedio([
      { medio: "YAPE", monto: 0, pagos: 0 },
      { medio: "PLIN", monto: 0, pagos: 0 },
    ]);
    expect(reparto.every((r) => r.porcentaje === 0)).toBe(true);
  });
});

describe("marcas del eje", () => {
  it("un dia: cada seis horas y el final del dia", () => {
    const marcas = marcasDelEje(new Date(2026, 9, 21), new Date(2026, 9, 22));
    expect(marcas.map((m) => m.texto)).toEqual(["0 h", "6 h", "12 h", "18 h", "24 h"]);
    expect(marcas.map((m) => m.posicion)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("una semana: un dia por marca, al centro de su columna", () => {
    // Del lunes 19 al lunes 26 de octubre de 2026.
    const marcas = marcasDelEje(new Date(2026, 9, 19), new Date(2026, 9, 26));
    expect(marcas.map((m) => m.texto)).toEqual(["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]);
    expect(marcas[0]?.posicion).toBeCloseTo(0.5 / 7);
    expect(marcas[6]?.posicion).toBeCloseTo(6.5 / 7);
  });

  it("un mes: el 1, 8, 15, 22 y 29", () => {
    const marcas = marcasDelEje(new Date(2026, 9, 1), new Date(2026, 10, 1));
    expect(marcas.map((m) => m.texto)).toEqual(["1", "8", "15", "22", "29"]);
    expect(marcas[0]?.posicion).toBe(0);
  });

  it("un periodo vacio no tiene marcas", () => {
    const dia = new Date(2026, 9, 21);
    expect(marcasDelEje(dia, dia)).toEqual([]);
  });
});

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
