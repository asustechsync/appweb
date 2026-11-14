import { describe, expect, it } from "vitest";

import {
  acumular,
  extremosDeSerie,
  franjasDelResumen,
  historialDeClientes,
  historialDeVentas,
  marcasDelEje,
  repartoPorMedio,
  serieEnTramos,
  seriesDelResumen,
  tramosDelHistorial,
  ventanaDe,
  ventanaDeFecha,
} from "./resumen";

describe("extremos de una serie", () => {
  it("da el mejor, el peor y el promedio; con empate gana el primero", () => {
    const r = extremosDeSerie([2, 6, 0, 6, 0]);
    expect(r.mejor).toEqual({ indice: 1, valor: 6 });
    expect(r.peor).toEqual({ indice: 2, valor: 0 });
    expect(r.promedio).toBeCloseTo(2.8);
  });

  it("una serie vacia no revienta", () => {
    expect(extremosDeSerie([]).promedio).toBe(0);
  });
});

describe("franjas por hora", () => {
  it("agrupa por hora de Lima, no por la del servidor", () => {
    // 10:30 UTC son las 5:30 a. m. en Lima; 04:10 UTC, las 11:10 p. m. del dia anterior.
    const franjas = franjasDelResumen(
      [
        { en: new Date("2026-11-12T10:30:00Z"), total: 100 },
        { en: new Date("2026-11-12T10:50:00Z"), total: 50 },
      ],
      [new Date("2026-11-12T10:05:00Z"), new Date("2026-11-12T04:10:00Z")],
    );
    expect(franjas.pedidos).toHaveLength(24);
    expect(franjas.pedidos[5]).toBe(2);
    expect(franjas.ventas[5]).toBe(150);
    expect(franjas.ticket[5]).toBe(75);
    expect(franjas.clientesNuevos[5]).toBe(1);
    expect(franjas.clientesNuevos[23]).toBe(1);
  });

  it("sin datos, las 24 horas valen 0", () => {
    const franjas = franjasDelResumen([], []);
    expect(franjas.ticket.every((v) => v === 0)).toBe(true);
    expect(franjas.ticket).toHaveLength(24);
  });
});

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

  it("una semana: un dia por marca, en su hora 0", () => {
    // Del lunes 19 al lunes 26 de octubre de 2026.
    const marcas = marcasDelEje(new Date(2026, 9, 19), new Date(2026, 9, 26));
    expect(marcas.map((m) => m.texto)).toEqual(["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]);
    expect(marcas[0]?.posicion).toBe(0);
    expect(marcas[6]?.posicion).toBeCloseTo(6 / 7);
  });

  it("un mes: cinco marcas repartidas, la ultima es el ultimo dia", () => {
    const textos = (desde: Date, fin: Date) => marcasDelEje(desde, fin).map((m) => m.texto);
    // Octubre (31), noviembre (30), febrero (28) y febrero bisiesto (29).
    expect(textos(new Date(2026, 9, 1), new Date(2026, 10, 1))).toEqual([
      "1",
      "9",
      "16",
      "24",
      "31",
    ]);
    expect(textos(new Date(2026, 10, 1), new Date(2026, 11, 1))).toEqual([
      "1",
      "8",
      "16",
      "23",
      "30",
    ]);
    expect(textos(new Date(2026, 1, 1), new Date(2026, 2, 1))).toEqual([
      "1",
      "8",
      "15",
      "21",
      "28",
    ]);
    expect(textos(new Date(2028, 1, 1), new Date(2028, 2, 1))).toEqual([
      "1",
      "8",
      "15",
      "22",
      "29",
    ]);
    const marcas = marcasDelEje(new Date(2026, 9, 1), new Date(2026, 10, 1));
    expect(marcas[0]?.posicion).toBe(0);
    expect(marcas[4]?.posicion).toBe(1);
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

describe("historial de las tarjetas", () => {
  const ahora = new Date(2026, 10, 12, 15, 0);

  it("da siete dias que terminan hoy, con ayer como penultimo", () => {
    const ventana = ventanaDe("dia", ahora);
    const tramos = tramosDelHistorial(ventana, "dia");
    expect(tramos).toHaveLength(7);
    expect(tramos[0]?.desde).toEqual(new Date(2026, 10, 6));
    expect(tramos[5]).toEqual({ desde: ventana.previoDesde, hasta: ventana.previoHasta });
    expect(tramos[6]).toEqual({ desde: ventana.desde, hasta: ventana.fin });
  });

  it("retrocede meses del calendario, no bloques de treinta dias", () => {
    const tramos = tramosDelHistorial(ventanaDe("mes", ahora), "mes");
    expect(tramos[0]?.desde).toEqual(new Date(2026, 4, 1));
    expect(tramos[5]?.hasta).toEqual(new Date(2026, 10, 1));
  });

  it("cuenta nuevos, compradores y recurrentes de cada tramo", () => {
    const tramos = tramosDelHistorial(ventanaDe("dia", ahora), "dia", 2);
    const ayer = new Date(2026, 10, 11, 10);
    const hoy = new Date(2026, 10, 12, 10);
    const historial = historialDeClientes(
      tramos,
      [ayer, hoy, hoy],
      [
        { usuarioId: "a", en: ayer },
        { usuarioId: "a", en: hoy },
        { usuarioId: "b", en: hoy },
        { usuarioId: "b", en: hoy },
      ],
      new Map([
        ["a", ayer],
        ["b", hoy],
      ]),
    );
    expect(historial).toEqual({ nuevos: [1, 2], compradores: [1, 2], recurrentes: [0, 1] });
  });
});

describe("historial de ventas por tramo", () => {
  it("cuenta recibidos, pagados, cancelados, descuentos, ticket y ganancia de cada dia", () => {
    const ahora = new Date(2026, 10, 12, 18);
    const tramos = tramosDelHistorial(ventanaDe("dia", ahora), "dia", 2);
    const ayer = new Date(2026, 10, 11, 10);
    const hoy = new Date(2026, 10, 12, 10);
    const historial = historialDeVentas(
      tramos,
      [
        { en: ayer, estado: "PAGADO", subtotal: 100, descuento: 0 },
        { en: hoy, estado: "ENTREGADO", subtotal: 100, descuento: 10 },
        { en: hoy, estado: "PAGADO", subtotal: 50, descuento: 0 },
        { en: hoy, estado: "CANCELADO", subtotal: 30, descuento: 0 },
        { en: hoy, estado: "PENDIENTE_PAGO", subtotal: 20, descuento: 0 },
      ],
      [
        { en: ayer, precioUnitario: 100, costoUnitario: 60, cantidad: 1, subtotal: 100, descuento: 0 },
        { en: hoy, precioUnitario: 50, costoUnitario: 30, cantidad: 1, subtotal: 50, descuento: 0 },
      ],
      ["PAGADO", "ENTREGADO"],
    );
    expect(historial.recibidos).toEqual([1, 4]);
    expect(historial.pagados).toEqual([1, 2]);
    expect(historial.cancelados).toEqual([0, 1]);
    expect(historial.descuentos).toEqual([0, 10]);
    expect(historial.ticket).toEqual([100, 70]);
    expect(historial.ticketMaximo).toEqual([100, 90]);
    expect(historial.ticketMinimo).toEqual([100, 50]);
    expect(historial.ganancia).toEqual([40, 20]);
    expect(historial.margen).toEqual([40, 40]);
  });

  it("un tramo sin pedidos queda en cero", () => {
    const tramos = tramosDelHistorial(ventanaDe("dia", new Date(2026, 10, 12, 18)), "dia", 1);
    expect(historialDeVentas(tramos, [], [], ["PAGADO"]).ticketMinimo).toEqual([0]);
  });
});
