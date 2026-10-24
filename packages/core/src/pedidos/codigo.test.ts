import { describe, expect, it } from "vitest";

import { codigoCorto, prefijoCodigoPedido, siguienteCodigoPedido } from "./codigo";

const DIA = new Date(2026, 9, 23);

describe("codigo del pedido", () => {
  it("el prefijo lleva la fecha como AAMMDD", () => {
    expect(prefijoCodigoPedido(DIA)).toBe("261023-");
  });

  it("el primer pedido del dia es el 0001", () => {
    expect(siguienteCodigoPedido(DIA, null)).toBe("261023-0001");
  });

  it("cada pedido toma el numero siguiente", () => {
    expect(siguienteCodigoPedido(DIA, "261023-0041")).toBe("261023-0042");
  });

  it("pasado el 9999 gana un digito", () => {
    expect(siguienteCodigoPedido(DIA, "261023-9999")).toBe("261023-10000");
  });

  it("un ultimo codigo de otro dia o de otro formato reinicia en 0001", () => {
    expect(siguienteCodigoPedido(DIA, "261022-0300")).toBe("261023-0001");
    expect(siguienteCodigoPedido(DIA, "PED-20261023-F52U")).toBe("261023-0001");
  });
});

describe("codigo corto", () => {
  it("el codigo actual queda igual", () => {
    expect(codigoCorto("261023-0042")).toBe("261023-0042");
  });

  it("quita el prefijo PED- de los codigos anteriores", () => {
    expect(codigoCorto("PED-20261023-F52U")).toBe("20261023-F52U");
  });

  it("un codigo con otra forma queda igual", () => {
    expect(codigoCorto("P-1042")).toBe("P-1042");
  });
});
