import { describe, expect, it } from "vitest";

import {
  filtrosDesdeUrl,
  hayFiltros,
  ordenarPorPrecio,
  SIN_FILTROS,
  terminosDeBusqueda,
  urlDeFiltros,
} from "./filtros";

describe("filtros del listado", () => {
  it("lee los filtros validos de la URL", () => {
    expect(
      filtrosDesdeUrl({
        talla: "xl",
        marca: "fila",
        orden: "precio-asc",
        ofertas: "1",
        sub: "boxers",
      }),
    ).toEqual({
      ...SIN_FILTROS,
      sub: "boxers",
      talla: "XL",
      marca: "fila",
      orden: "precio-asc",
      ofertas: true,
    });
  });

  it("lee color, disponibilidad y rango de precio", () => {
    expect(
      filtrosDesdeUrl({ color: "Azul marino", stock: "1", precioMin: "20", precioMax: "45" }),
    ).toEqual({
      ...SIN_FILTROS,
      color: "Azul marino",
      stock: true,
      precioMin: 20,
      precioMax: 45,
    });
  });

  it("acepta un precio solo, y descarta un rango al reves o raro", () => {
    expect(filtrosDesdeUrl({ precioMin: "20" })).toEqual({ ...SIN_FILTROS, precioMin: 20 });
    expect(filtrosDesdeUrl({ precioMax: "45" })).toEqual({ ...SIN_FILTROS, precioMax: 45 });
    expect(filtrosDesdeUrl({ precioMin: "50", precioMax: "20" })).toEqual(SIN_FILTROS);
    expect(filtrosDesdeUrl({ precioMin: "-5", precioMax: "1e3" })).toEqual(SIN_FILTROS);
    expect(filtrosDesdeUrl({ precioMin: "1234567" })).toEqual(SIN_FILTROS);
  });

  it("descarta lo que no es valido", () => {
    expect(
      filtrosDesdeUrl({
        talla: "M; DROP",
        marca: "../x",
        orden: "caro",
        ofertas: "si",
        sub: "A B",
        color: "Rojo; DROP",
        precioMin: "gratis",
        precioMax: "mucho",
        stock: "si",
      }),
    ).toEqual(SIN_FILTROS);
    expect(filtrosDesdeUrl({ talla: ["S", "M"] }).talla).toBe("S");
  });

  it("arma la URL omitiendo lo que esta por defecto", () => {
    expect(urlDeFiltros("/categorias/hombres", SIN_FILTROS)).toBe("/categorias/hombres");
    const f = { ...SIN_FILTROS, talla: "M" };
    expect(urlDeFiltros("/categorias/hombres", f, { orden: "precio-desc" })).toBe(
      "/categorias/hombres?talla=M&orden=precio-desc",
    );
    expect(urlDeFiltros("/c", f, { talla: null })).toBe("/c");
    expect(urlDeFiltros("/buscar?q=boxer", SIN_FILTROS, { orden: "precio-asc" })).toBe(
      "/buscar?q=boxer&orden=precio-asc",
    );
  });

  it("escribe color, rango de precio y disponibilidad en la URL", () => {
    const f = {
      ...SIN_FILTROS,
      color: "Azul marino",
      precioMin: 20,
      precioMax: 45,
      stock: true,
    };
    expect(urlDeFiltros("/c", f)).toBe("/c?color=Azul+marino&precioMin=20&precioMax=45&stock=1");
    expect(
      urlDeFiltros("/c", f, { color: null, precioMin: null, precioMax: null, stock: false }),
    ).toBe("/c");
  });

  it("el orden no cuenta como filtro para limpiar", () => {
    expect(hayFiltros({ ...SIN_FILTROS, orden: "precio-asc" })).toBe(false);
    expect(hayFiltros({ ...SIN_FILTROS, ofertas: true })).toBe(true);
    expect(hayFiltros({ ...SIN_FILTROS, color: "Negro" })).toBe(true);
    expect(hayFiltros({ ...SIN_FILTROS, precioMin: 20 })).toBe(true);
    expect(hayFiltros({ ...SIN_FILTROS, precioMax: 45 })).toBe(true);
    expect(hayFiltros({ ...SIN_FILTROS, stock: true })).toBe(true);
  });
});

describe("terminos de busqueda", () => {
  it("quita tildes, mayusculas, repetidas y palabras de una letra", () => {
    expect(terminosDeBusqueda("Boxer Algodón  y algodon")).toEqual(["boxer", "algodon"]);
    expect(terminosDeBusqueda("Niño")).toEqual(["nino"]);
  });

  it("no busca con texto vacio o sin letras utiles", () => {
    expect(terminosDeBusqueda("")).toEqual([]);
    expect(terminosDeBusqueda("a !")).toEqual([]);
  });
});

describe("orden de resultados", () => {
  const lista = [{ precio: 20 }, { precio: 10 }, { precio: 30 }];
  it("ordena por precio sin tocar la lista original", () => {
    expect(ordenarPorPrecio(lista, "precio-asc").map((p) => p.precio)).toEqual([10, 20, 30]);
    expect(ordenarPorPrecio(lista, "precio-desc").map((p) => p.precio)).toEqual([30, 20, 10]);
    expect(ordenarPorPrecio(lista, "novedades")).toBe(lista);
  });
});
