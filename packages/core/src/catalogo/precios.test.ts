import { describe, expect, it } from "vitest";

import { resolverDisponibilidad, resolverNivelStock, resolverPrecio } from "./precios";
import { opcionesDeCompra } from "./variantes";

describe("resolverPrecio", () => {
  it("sin precio de lista no hay oferta", () => {
    expect(resolverPrecio({ precio: 30, precioLista: null })).toEqual({
      precio: 30,
      precioLista: null,
      enOferta: false,
      descuentoPct: null,
      ahorro: 0,
    });
  });

  it("un precio de lista menor o igual no cuenta como oferta", () => {
    expect(resolverPrecio({ precio: 30, precioLista: 30 }).enOferta).toBe(false);
    expect(resolverPrecio({ precio: 30, precioLista: 20 }).precioLista).toBeNull();
  });

  it("calcula ahorro y porcentaje entero", () => {
    const precio = resolverPrecio({ precio: 29.9, precioLista: 39.9 });
    expect(precio.enOferta).toBe(true);
    expect(precio.ahorro).toBe(10);
    expect(precio.descuentoPct).toBe(25);
  });
});

describe("resolverDisponibilidad", () => {
  const variantes = [
    { talla: "M", color: "Negro", stock: 2, activo: true },
    { talla: "L", color: "Blanco", stock: 0, activo: true },
    { talla: "S", color: "Rojo", stock: 9, activo: false },
  ];

  it("ignora variantes inactivas y sin stock", () => {
    const disponibilidad = resolverDisponibilidad(variantes);
    expect(disponibilidad.stockTotal).toBe(2);
    expect(disponibilidad.tallas).toEqual(["M"]);
    expect(disponibilidad.colores).toEqual(["Negro"]);
  });

  it("marca stock bajo por debajo del umbral", () => {
    expect(resolverDisponibilidad(variantes).stockBajo).toBe(true);
    expect(resolverDisponibilidad(variantes, 1).stockBajo).toBe(false);
  });

  it("sin stock no hay stock bajo", () => {
    const agotado = resolverDisponibilidad([
      { talla: "M", color: "Negro", stock: 0, activo: true },
    ]);
    expect(agotado.hayStock).toBe(false);
    expect(agotado.stockBajo).toBe(false);
  });
});

describe("resolverNivelStock", () => {
  it("sin entradas no hay porcentaje", () => {
    expect(resolverNivelStock(5, 0)).toEqual({ restante: 5, porcentaje: null });
  });

  it("nunca baja de cero ni pasa de cien", () => {
    expect(resolverNivelStock(-3, 10)).toEqual({ restante: 0, porcentaje: 0 });
    expect(resolverNivelStock(15, 10).porcentaje).toBe(100);
  });
});

describe("opcionesDeCompra", () => {
  it("ordena las tallas como se compra ropa, no alfabeticamente", () => {
    const tallas = opcionesDeCompra(
      ["XL", "S", "12M", "Unica", "M", "10", "6M", "6"].map((talla, i) => ({
        varianteId: `v${i}`,
        talla,
        color: "Negro",
        stock: 1,
      })),
    ).map((opcion) => opcion.talla);

    expect(tallas).toEqual(["S", "M", "XL", "6M", "12M", "6", "10", "Unica"]);
  });

  it("deja fuera las tallas sin ningun color con stock", () => {
    const opciones = opcionesDeCompra([
      { varianteId: "a", talla: "S", color: "Negro", stock: 0 },
      { varianteId: "b", talla: "M", color: "Negro", stock: 3 },
    ]);
    expect(opciones.map((o) => o.talla)).toEqual(["M"]);
  });

  it("no repite un color dentro de la misma talla", () => {
    const [opcion] = opcionesDeCompra([
      { varianteId: "a", talla: "M", color: "Negro", stock: 1 },
      { varianteId: "b", talla: "M", color: "Negro", stock: 2 },
      { varianteId: "c", talla: "M", color: "Gris", stock: 2, sku: "SKU-C" },
    ]);
    expect(opcion?.colores).toEqual([
      { color: "Negro", varianteId: "a" },
      { color: "Gris", varianteId: "c", sku: "SKU-C" },
    ]);
  });
});
