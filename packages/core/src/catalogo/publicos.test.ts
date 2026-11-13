import { describe, expect, it } from "vitest";

import { esquemaCategoria, esquemaProducto, esquemaTipoPrenda } from "../tipos";
import { ordenarPublicos } from "./publicos";

const PRODUCTO = {
  nombre: "Media tobillera",
  slug: "media-tobillera",

  precio: 10,
};

describe("publicos del producto", () => {
  it("los deja sin repetir y en el orden del menu", () => {
    expect(ordenarPublicos(["MUJER", "HOMBRE", "MUJER"])).toEqual(["HOMBRE", "MUJER"]);
  });

  it("una media unisex guarda los dos publicos", () => {
    const leido = esquemaProducto.parse({ ...PRODUCTO, publicos: ["MUJER", "HOMBRE"] });
    expect(leido.publicos).toEqual(["HOMBRE", "MUJER"]);
  });

  it("exige elegir para quien es", () => {
    expect(esquemaProducto.safeParse({ ...PRODUCTO, publicos: [] }).success).toBe(false);
    expect(esquemaProducto.safeParse(PRODUCTO).success).toBe(false);
  });

  it("rechaza un publico que no existe", () => {
    expect(esquemaProducto.safeParse({ ...PRODUCTO, publicos: ["ADULTOS"] }).success).toBe(false);
  });
});

describe("el tipo decide la categoria", () => {
  const TIPO = { codigo: "bx", nombre: "Boxer", tallas: ["M"], palabras: [], orden: 0 };

  it("el producto ya no elige categoria a mano", () => {
    const leido = esquemaProducto.parse({ ...PRODUCTO, publicos: ["HOMBRE"], categoriaId: "x" });
    expect("categoriaId" in leido).toBe(false);
  });

  it("un tipo nuevo puede nacer sin categoria", () => {
    expect(esquemaTipoPrenda.parse(TIPO).categoriaId).toBeNull();
  });

  it("el tipo guarda su categoria", () => {
    expect(esquemaTipoPrenda.parse({ ...TIPO, categoriaId: "boxers" }).categoriaId).toBe("boxers");
  });
});

describe("clase de categoria", () => {
  const CATEGORIA = { nombre: "Medias", slug: "medias", padreId: null, orden: 0 };

  it("sin publico es de tipo", () => {
    expect(esquemaCategoria.parse(CATEGORIA).publico).toBeNull();
  });

  it("con publico es de publico", () => {
    expect(esquemaCategoria.parse({ ...CATEGORIA, publico: "BEBES" }).publico).toBe("BEBES");
  });
});
