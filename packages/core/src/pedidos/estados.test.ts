import { describe, expect, it } from "vitest";

import { cubreDepartamento } from "../envios/zonas";
import { afectaStock, esFinal, pasosDelPedido, puedePasarA } from "./estados";

describe("estados del pedido", () => {
  it("sigue el camino feliz paso a paso", () => {
    expect(puedePasarA("PENDIENTE_PAGO", "PAGADO")).toBe(true);
    expect(puedePasarA("PAGADO", "PREPARANDO")).toBe(true);
    expect(puedePasarA("ENVIADO", "ENTREGADO")).toBe(true);
  });

  it("no permite saltos ni volver atras", () => {
    expect(puedePasarA("PENDIENTE_PAGO", "ENVIADO")).toBe(false);
    expect(puedePasarA("ENVIADO", "PAGADO")).toBe(false);
    expect(puedePasarA("ENVIADO", "CANCELADO")).toBe(false);
  });

  it("entregado y cancelado son finales", () => {
    expect(esFinal("ENTREGADO")).toBe(true);
    expect(esFinal("CANCELADO")).toBe(true);
    expect(esFinal("PAGADO")).toBe(false);
  });

  it("descuenta stock al pagar y lo devuelve solo si ya se habia pagado", () => {
    expect(afectaStock("PENDIENTE_PAGO", "PAGADO")).toBe("descontar");
    expect(afectaStock("PREPARANDO", "CANCELADO")).toBe("devolver");
    expect(afectaStock("PENDIENTE_PAGO", "CANCELADO")).toBeNull();
    expect(afectaStock("PAGADO", "PREPARANDO")).toBeNull();
  });

  it("marca los pasos hechos, el actual y los pendientes", () => {
    expect(pasosDelPedido("PAGADO").map((p) => p.situacion)).toEqual([
      "hecho",
      "hecho",
      "actual",
      "pendiente",
      "pendiente",
    ]);
    expect(pasosDelPedido("CANCELADO")).toEqual([]);
  });
});

describe("zonas de envio", () => {
  it("sin departamentos cubre todo el pais", () => {
    expect(cubreDepartamento([], "Cusco")).toBe(true);
  });

  it("compara sin tildes, mayusculas ni espacios", () => {
    expect(cubreDepartamento(["Lima", "Callao"], "  LIMA ")).toBe(true);
    expect(cubreDepartamento(["Junín"], "junin")).toBe(true);
    expect(cubreDepartamento(["Lima"], "Cusco")).toBe(false);
  });
});
