import { describe, expect, it } from "vitest";

import { PagoManual } from "./pago-manual";

const solicitud = {
  pedidoId: "p1",
  codigoPedido: "PED-1",
  monto: 50,
  medio: "tarjeta" as const,
  emailCliente: "cliente@ejemplo.pe",
};

describe("tarjeta de prueba en el pago manual", () => {
  it("apagada: no ofrece tarjeta y la rechaza", async () => {
    const pasarela = new PagoManual();
    expect(pasarela.mediosSoportados).not.toContain("tarjeta");
    expect((await pasarela.cobrar(solicitud)).estado).toBe("rechazado");
  });

  it("encendida: la ofrece y queda pendiente sin cobrar nada", async () => {
    const pasarela = new PagoManual({ tarjetaDePrueba: true });
    expect(pasarela.mediosSoportados).toContain("tarjeta");
    const resultado = await pasarela.cobrar(solicitud);
    expect(resultado.estado).toBe("pendiente");
  });
});
