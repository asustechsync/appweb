import { describe, expect, it } from "vitest";

import {
  enlaceCompartirWhatsApp,
  enlaceWhatsApp,
  mensajeComprobanteWhatsApp,
  mensajePagoRecibidoWhatsApp,
  numeroWhatsApp,
} from "./whatsapp";

describe("whatsapp", () => {
  it("normaliza celulares peruanos al formato de wa.me", () => {
    expect(numeroWhatsApp("987 654 321")).toBe("51987654321");
    expect(numeroWhatsApp("+51 987-654-321")).toBe("51987654321");
    expect(numeroWhatsApp("12345")).toBeNull();
    expect(numeroWhatsApp(null)).toBeNull();
  });

  it("arma el enlace con el mensaje codificado", () => {
    expect(enlaceWhatsApp("987654321", "Hola, ¿tienen talla M?")).toBe(
      "https://wa.me/51987654321?text=Hola%2C%20%C2%BFtienen%20talla%20M%3F",
    );
    expect(enlaceWhatsApp("", "x")).toBeNull();
  });

  it("el mensaje del comprobante lleva codigo y monto", () => {
    expect(mensajeComprobanteWhatsApp({ codigo: "PED-1", total: 59.9 })).toContain("PED-1");
    expect(mensajeComprobanteWhatsApp({ codigo: "PED-1", total: 59.9 })).toContain("59.90");
  });

  it("el aviso de pago recibido lleva nombre, monto, medio y pedido", () => {
    const mensaje = mensajePagoRecibidoWhatsApp({
      nombre: "Garuda",
      codigo: "261024-0002",
      monto: 104.44,
      medio: "Yape",
    });
    expect(mensaje).toContain("Garuda");
    expect(mensaje).toContain("104.44");
    expect(mensaje).toContain("Yape");
    expect(mensaje).toContain("261024-0002");
  });

  it("sin numero comparte el mensaje para elegir el chat", () => {
    expect(enlaceCompartirWhatsApp("Hola")).toBe("https://wa.me/?text=Hola");
  });
});
