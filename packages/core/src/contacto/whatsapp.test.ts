import { describe, expect, it } from "vitest";

import { enlaceWhatsApp, mensajeComprobanteWhatsApp, numeroWhatsApp } from "./whatsapp";

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
});
