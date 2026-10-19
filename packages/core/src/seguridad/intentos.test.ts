import { describe, expect, it } from "vitest";

import { LimiteDeIntentos, mensajeDeEspera } from "./intentos";

const MINUTO = 60_000;

describe("limite de intentos", () => {
  it("deja pasar hasta el maximo y frena el siguiente", () => {
    const limite = new LimiteDeIntentos(3, 10 * MINUTO);
    expect(limite.consumir("ip", 0).permitido).toBe(true);
    expect(limite.consumir("ip", 1).permitido).toBe(true);
    expect(limite.consumir("ip", 2).permitido).toBe(true);
    const frenado = limite.consumir("ip", 3);
    expect(frenado.permitido).toBe(false);
    expect(frenado.reintentarEnMs).toBe(10 * MINUTO - 3);
  });

  it("libera cupo cuando el intento mas viejo sale de la ventana", () => {
    const limite = new LimiteDeIntentos(2, 10 * MINUTO);
    limite.consumir("ip", 0);
    limite.consumir("ip", 5 * MINUTO);
    expect(limite.revisar("ip", 9 * MINUTO).permitido).toBe(false);
    expect(limite.revisar("ip", 10 * MINUTO + 1).permitido).toBe(true);
  });

  it("lleva la cuenta por clave y se puede limpiar", () => {
    const limite = new LimiteDeIntentos(1, MINUTO);
    limite.registrar("a@x.pe", 0);
    expect(limite.revisar("a@x.pe", 1).permitido).toBe(false);
    expect(limite.revisar("b@x.pe", 1).permitido).toBe(true);
    limite.limpiar("a@x.pe");
    expect(limite.revisar("a@x.pe", 2).permitido).toBe(true);
  });

  it("revisar no gasta cupo", () => {
    const limite = new LimiteDeIntentos(1, MINUTO);
    limite.revisar("ip", 0);
    limite.revisar("ip", 0);
    expect(limite.consumir("ip", 0).permitido).toBe(true);
  });

  it("redondea la espera hacia arriba en minutos", () => {
    expect(mensajeDeEspera(30_000)).toBe("Demasiados intentos. Vuelve a intentarlo en 1 minuto.");
    expect(mensajeDeEspera(11 * MINUTO + 1)).toBe(
      "Demasiados intentos. Vuelve a intentarlo en 12 minutos.",
    );
  });
});
