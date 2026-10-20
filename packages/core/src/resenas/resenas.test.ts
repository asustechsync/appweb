import { describe, expect, it } from "vitest";

import { autorDeResena, resumenCalificacion, revisarResena } from "./resenas";

describe("reseñas", () => {
  it("solo opina quien recibio el producto", () => {
    expect(revisarResena({ compro: false, estadoActual: null })).toBe("sin_compra");
    expect(revisarResena({ compro: true, estadoActual: null })).toBeNull();
  });

  it("se puede reescribir mientras no este publicada", () => {
    expect(revisarResena({ compro: true, estadoActual: "PENDIENTE" })).toBeNull();
    expect(revisarResena({ compro: true, estadoActual: "RECHAZADA" })).toBeNull();
    expect(revisarResena({ compro: true, estadoActual: "APROBADA" })).toBe("ya_publicada");
  });

  it("resume la nota con un decimal y sin reseñas no hay nota", () => {
    expect(resumenCalificacion(0, 0)).toBeNull();
    expect(resumenCalificacion(3, 14)).toEqual({ promedio: 4.7, total: 3 });
    expect(resumenCalificacion(2, 10)).toEqual({ promedio: 5, total: 2 });
  });

  it("firma con el nombre de pila y la inicial del apellido", () => {
    expect(
      autorDeResena({ nombre: "Leonardo Andres", apellidoPaterno: "quea", email: "a@b.pe" }),
    ).toBe("Leonardo Q.");
    expect(autorDeResena({ nombre: "Ana", apellidoPaterno: null, email: "a@b.pe" })).toBe("Ana");
    expect(
      autorDeResena({
        nombre: "Cuenta eliminada",
        apellidoPaterno: null,
        email: "eliminado-x@anonimo.invalid",
      }),
    ).toBe("Cliente");
  });
});
