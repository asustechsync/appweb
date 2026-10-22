import { describe, expect, it } from "vitest";

import {
  esDevolucion,
  movimientosDeDevolucion,
  notaDeDevolucion,
  revisarDevolucion,
  tipoDeDevolucion,
  type EntradaDevolucion,
} from "./devoluciones";
import { revisarRechazoPago } from "./pagos";

const base: EntradaDevolucion = {
  estadoPedido: "ENTREGADO",
  medio: "YAPE",
  lineas: [{ varianteId: "v1", vendidas: 3, yaDevueltas: 0, aDevolver: 1 }],
  reembolso: 0,
  reembolsable: 90,
  referencia: null,
  motivo: "Talla pequeña",
};

describe("revisar devolucion", () => {
  it("acepta una devolucion de un pedido entregado", () => {
    expect(revisarDevolucion(base)).toBeNull();
  });

  it("solo entregados o cancelados", () => {
    expect(revisarDevolucion({ ...base, estadoPedido: "ENVIADO" })).toBe("pedido_no_devolvible");
  });

  it("un cancelado solo admite reembolso", () => {
    expect(revisarDevolucion({ ...base, estadoPedido: "CANCELADO" })).toBe(
      "cancelado_sin_unidades",
    );
    expect(
      revisarDevolucion({
        ...base,
        estadoPedido: "CANCELADO",
        lineas: [],
        reembolso: 30,
        referencia: "991",
      }),
    ).toBeNull();
  });

  it("no devuelve mas de lo que queda", () => {
    const lineas = [{ varianteId: "v1", vendidas: 3, yaDevueltas: 2, aDevolver: 2 }];
    expect(revisarDevolucion({ ...base, lineas })).toBe("excede_lo_vendido");
  });

  it("exige algo que registrar y un motivo", () => {
    const lineas = [{ varianteId: "v1", vendidas: 3, yaDevueltas: 0, aDevolver: 0 }];
    expect(revisarDevolucion({ ...base, lineas })).toBe("nada_que_registrar");
    expect(revisarDevolucion({ ...base, motivo: " " })).toBe("falta_motivo");
  });

  it("el reembolso no supera lo pagado y lleva numero de operacion", () => {
    expect(revisarDevolucion({ ...base, reembolso: 100, referencia: "1" })).toBe(
      "reembolso_excede",
    );
    expect(revisarDevolucion({ ...base, reembolso: 30 })).toBe("falta_referencia");
    expect(revisarDevolucion({ ...base, medio: "CONTRA_ENTREGA", reembolso: 30 })).toBeNull();
  });

  it("un cambio es por otra variante del mismo producto con stock", () => {
    const cambio = (reemplazo: { varianteId: string; mismoProducto: boolean; stock: number }) =>
      revisarDevolucion({
        ...base,
        lineas: [{ varianteId: "v1", vendidas: 3, yaDevueltas: 0, aDevolver: 2, reemplazo }],
      });
    expect(cambio({ varianteId: "v2", mismoProducto: true, stock: 5 })).toBeNull();
    expect(cambio({ varianteId: "v1", mismoProducto: true, stock: 5 })).toBe("reemplazo_igual");
    expect(cambio({ varianteId: "v9", mismoProducto: false, stock: 5 })).toBe(
      "reemplazo_otro_producto",
    );
    expect(cambio({ varianteId: "v2", mismoProducto: true, stock: 1 })).toBe("reemplazo_sin_stock");
  });
});

describe("movimientos y nota", () => {
  it("devuelve al almacen y descuenta el reemplazo", () => {
    const lineas = [
      {
        varianteId: "v1",
        vendidas: 2,
        yaDevueltas: 0,
        aDevolver: 2,
        reemplazo: { varianteId: "v2", mismoProducto: true, stock: 4 },
      },
      { varianteId: "v3", vendidas: 1, yaDevueltas: 0, aDevolver: 0 },
    ];
    expect(movimientosDeDevolucion(lineas, "p1", "Talla")).toEqual([
      { varianteId: "v1", delta: 2, motivo: "DEVOLUCION", pedidoId: "p1", nota: "Cambio: Talla" },
      { varianteId: "v2", delta: -2, motivo: "VENTA", pedidoId: "p1", nota: "Cambio: Talla" },
    ]);
    expect(tipoDeDevolucion(lineas)).toBe("CAMBIO");
    expect(tipoDeDevolucion([])).toBe("REEMBOLSO");
  });

  it("la nota dice que volvio, que se cambio y cuanto se devolvio", () => {
    const nota = notaDeDevolucion({
      devueltas: 3,
      cambiadas: 1,
      reembolso: 30,
      medio: "PLIN",
      referencia: "778",
      motivo: "Defecto",
    });
    expect(nota).toContain("Devolución de 2 u.");
    expect(nota).toContain("Cambio de 1 u.");
    expect(nota).toContain("por Plin (op. 778)");
    expect(nota).toContain("Motivo: Defecto");
  });

  it("reconoce la linea de historial de una devolucion", () => {
    expect(esDevolucion("ENTREGADO", "ENTREGADO")).toBe(true);
    expect(esDevolucion("ENVIADO", "ENTREGADO")).toBe(false);
    expect(esDevolucion("PENDIENTE_PAGO", "PENDIENTE_PAGO")).toBe(false);
  });
});

describe("rechazar pago", () => {
  const pago = {
    estadoPedido: "PENDIENTE_PAGO",
    estadoPago: "PENDIENTE",
    medio: "YAPE",
    motivo: "El monto no llegó",
  } as const;

  it("rechaza un pago pendiente con motivo", () => {
    expect(revisarRechazoPago(pago)).toBeNull();
    expect(revisarRechazoPago({ ...pago, motivo: "" })).toBe("falta_motivo");
    expect(revisarRechazoPago({ ...pago, medio: "CONTRA_ENTREGA" })).toBe(
      "contra_entrega_no_se_rechaza",
    );
    expect(revisarRechazoPago({ ...pago, estadoPago: "CONFIRMADO" })).toBe("pago_ya_resuelto");
    expect(revisarRechazoPago({ ...pago, estadoPedido: "PAGADO" })).toBe("pedido_no_pendiente");
  });
});
