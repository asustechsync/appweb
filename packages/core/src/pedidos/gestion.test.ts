import { describe, expect, it } from "vitest";

import { afectaStock, puedePasarA, siguientesEstados } from "./estados";
import {
  marcaDeTarjeta,
  movimientosDelCambio,
  notaDeCambio,
  revisarCambioEstado,
  revisarConfirmacionPago,
  variantesSinStock,
} from "./gestion";

describe("marca de tarjeta", () => {
  it("reconoce Visa y Mastercard como las escriba la pasarela", () => {
    expect(marcaDeTarjeta("Visa")).toBe("visa");
    expect(marcaDeTarjeta("VS")).toBe("visa");
    expect(marcaDeTarjeta("MASTERCARD")).toBe("mastercard");
    expect(marcaDeTarjeta(" mc ")).toBe("mastercard");
  });

  it("cualquier otra marca, o ninguna, es otra", () => {
    expect(marcaDeTarjeta("Amex")).toBe("otra");
    expect(marcaDeTarjeta(null)).toBe("otra");
  });
});

const pendiente = {
  estadoPedido: "PENDIENTE_PAGO",
  estadoPago: "PENDIENTE",
  medio: "YAPE",
  referencia: "123456",
} as const;

describe("confirmar pago", () => {
  it("acepta un pago pendiente con numero de operacion", () => {
    expect(revisarConfirmacionPago(pendiente)).toBeNull();
  });

  it("exige numero de operacion", () => {
    expect(revisarConfirmacionPago({ ...pendiente, referencia: "  " })).toBe("falta_referencia");
    expect(revisarConfirmacionPago({ ...pendiente, referencia: null })).toBe("falta_referencia");
  });

  it("no confirma dos veces ni un pedido que ya avanzo", () => {
    expect(revisarConfirmacionPago({ ...pendiente, estadoPago: "CONFIRMADO" })).toBe(
      "pago_ya_resuelto",
    );
    expect(revisarConfirmacionPago({ ...pendiente, estadoPedido: "PAGADO" })).toBe(
      "pedido_no_pendiente",
    );
  });

  it("contra entrega no se confirma por adelantado", () => {
    expect(revisarConfirmacionPago({ ...pendiente, medio: "CONTRA_ENTREGA" })).toBe(
      "contra_entrega_sin_pago_previo",
    );
  });
});

describe("cambiar estado", () => {
  it("PAGADO solo se alcanza confirmando el pago", () => {
    expect(revisarCambioEstado({ desde: "PENDIENTE_PAGO", hacia: "PAGADO", medio: "YAPE" })).toBe(
      "pagado_solo_confirmando",
    );
  });

  it("respeta las transiciones validas", () => {
    expect(revisarCambioEstado({ desde: "PAGADO", hacia: "PREPARANDO", medio: "YAPE" })).toBeNull();
    expect(revisarCambioEstado({ desde: "PAGADO", hacia: "ENTREGADO", medio: "YAPE" })).toBe(
      "transicion_invalida",
    );
  });

  it("contra entrega pasa de pendiente a preparando", () => {
    expect(
      revisarCambioEstado({
        desde: "PENDIENTE_PAGO",
        hacia: "PREPARANDO",
        medio: "CONTRA_ENTREGA",
      }),
    ).toBeNull();
    expect(
      revisarCambioEstado({ desde: "PENDIENTE_PAGO", hacia: "PREPARANDO", medio: "YAPE" }),
    ).toBe("transicion_invalida");
    expect(siguientesEstados("PENDIENTE_PAGO", { contraEntrega: true })).toEqual([
      "PREPARANDO",
      "CANCELADO",
    ]);
    expect(puedePasarA("PENDIENTE_PAGO", "PAGADO", { contraEntrega: true })).toBe(false);
  });

  it("descuenta al confirmar contra entrega y devuelve al cancelar", () => {
    expect(afectaStock("PENDIENTE_PAGO", "PREPARANDO")).toBe("descontar");
    expect(afectaStock("PREPARANDO", "CANCELADO")).toBe("devolver");
  });
});

describe("movimientos del cambio", () => {
  const lineas = [
    { varianteId: "a", cantidad: 2 },
    { varianteId: "b", cantidad: 1 },
    { varianteId: "a", cantidad: 1 },
  ];

  it("al pagar descuenta, juntando lineas de la misma variante", () => {
    const movimientos = movimientosDelCambio("PENDIENTE_PAGO", "PAGADO", lineas, "p1");
    expect(movimientos).toEqual([
      { varianteId: "a", delta: -3, motivo: "VENTA", pedidoId: "p1" },
      { varianteId: "b", delta: -1, motivo: "VENTA", pedidoId: "p1" },
    ]);
  });

  it("al cancelar un pedido pagado devuelve con nota", () => {
    const movimientos = movimientosDelCambio("PAGADO", "CANCELADO", lineas, "p1");
    expect(movimientos.map((m) => [m.varianteId, m.delta, m.motivo])).toEqual([
      ["a", 3, "DEVOLUCION"],
      ["b", 1, "DEVOLUCION"],
    ]);
    expect(movimientos[0]?.nota).toBe("Pedido cancelado");
  });

  it("cancelar uno sin pagar o avanzar de estado no toca stock", () => {
    expect(movimientosDelCambio("PENDIENTE_PAGO", "CANCELADO", lineas, "p1")).toEqual([]);
    expect(movimientosDelCambio("PREPARANDO", "ENVIADO", lineas, "p1")).toEqual([]);
  });
});

describe("variantesSinStock", () => {
  it("compara la suma por variante con el stock actual", () => {
    const stock = new Map([
      ["a", 2],
      ["b", 5],
    ]);
    expect(
      variantesSinStock(
        [
          { varianteId: "a", cantidad: 2 },
          { varianteId: "a", cantidad: 1 },
          { varianteId: "b", cantidad: 1 },
          { varianteId: "c", cantidad: 1 },
        ],
        stock,
      ),
    ).toEqual(["a", "c"]);
  });
});

describe("notaDeCambio", () => {
  it("describe la confirmacion con medio y operacion", () => {
    expect(notaDeCambio("PAGADO", { medio: "PLIN", referencia: " 998 " })).toBe(
      "Pago confirmado por Plin (op. 998)",
    );
  });

  it("agrega la nota escrita a mano", () => {
    expect(notaDeCambio("CANCELADO", { nota: "Cliente desistió" })).toBe(
      "Pasó a Cancelado. Cliente desistió",
    );
  });
});
