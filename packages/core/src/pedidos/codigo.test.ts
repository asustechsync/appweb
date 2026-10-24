import { describe, expect, it } from "vitest";

import { codigoCorto, generarCodigoPedido } from "./codigo";

describe("codigo corto", () => {
  it("quita el prefijo PED-", () => {
    expect(codigoCorto("PED-20261023-F52U")).toBe("20261023-F52U");
  });

  it("sirve con cualquier codigo recien generado", () => {
    const codigo = generarCodigoPedido(new Date(2026, 9, 23));
    expect(codigoCorto(codigo)).toBe(codigo.slice("PED-".length));
  });

  it("un codigo con otra forma queda igual", () => {
    expect(codigoCorto("P-1042")).toBe("P-1042");
  });
});
