import { describe, expect, it } from "vitest";

import { creariaCiclo } from "./arbol";
import { margenDe, movimientosDeCompra, revisarCompra, totalDeCompra } from "./compras";
import {
  ahorroDePack,
  costoDePack,
  prorratearPack,
  revisarPack,
  stockDePack,
  type ComponentePack,
} from "./packs";

describe("compras", () => {
  const lineas = [
    { varianteId: "a", cantidad: 10, costoUnitario: 8.5 },
    { varianteId: "b", cantidad: 3, costoUnitario: 12 },
  ];

  it("acepta una compra valida y suma su total", () => {
    expect(revisarCompra({ proveedorActivo: true, lineas })).toBeNull();
    expect(totalDeCompra(lineas)).toBe(121);
  });

  it("rechaza lo que no se puede registrar", () => {
    expect(revisarCompra({ proveedorActivo: false, lineas })).toBe("proveedor_inactivo");
    expect(revisarCompra({ proveedorActivo: true, lineas: [] })).toBe("sin_lineas");
    expect(
      revisarCompra({
        proveedorActivo: true,
        lineas: [{ varianteId: "a", cantidad: 1.5, costoUnitario: 1 }],
      }),
    ).toBe("cantidad_invalida");
    expect(
      revisarCompra({
        proveedorActivo: true,
        lineas: [{ varianteId: "a", cantidad: 1, costoUnitario: -1 }],
      }),
    ).toBe("costo_invalido");
    expect(revisarCompra({ proveedorActivo: true, lineas: [lineas[0]!, lineas[0]!] })).toBe(
      "variante_repetida",
    );
  });

  it("cada linea deja su ingreso de stock", () => {
    expect(movimientosDeCompra(lineas, "c1", "Compra a X")).toEqual([
      { varianteId: "a", delta: 10, motivo: "INGRESO", compraId: "c1", nota: "Compra a X" },
      { varianteId: "b", delta: 3, motivo: "INGRESO", compraId: "c1", nota: "Compra a X" },
    ]);
  });

  it("calcula el margen sobre el precio", () => {
    expect(margenDe(25, 8)).toEqual({ monto: 17, porcentaje: 68 });
    expect(margenDe(25, null)).toBeNull();
  });
});

describe("packs", () => {
  const comp = (
    varianteId: string,
    cantidad: number,
    stock: number,
    extra: Partial<ComponentePack> = {},
  ): ComponentePack => ({
    varianteId,
    cantidad,
    precioSuelto: 25,
    stock,
    activa: true,
    costo: 8,
    ...extra,
  });

  it("el stock lo pone el componente mas escaso", () => {
    expect(stockDePack([comp("a", 2, 9), comp("b", 1, 7)])).toBe(4);
    expect(stockDePack([comp("a", 1, 9, { activa: false })])).toBe(0);
    expect(stockDePack([])).toBe(0);
  });

  it("costo y ahorro", () => {
    expect(costoDePack([comp("a", 3, 10)])).toBe(24);
    expect(costoDePack([comp("a", 3, 10, { costo: null })])).toBeNull();
    expect(ahorroDePack(59, 75)).toBe(16);
  });

  it("revisa el pack", () => {
    expect(revisarPack({ precio: 59, componentes: [comp("a", 3, 0)] })).toBeNull();
    expect(revisarPack({ precio: 59, componentes: [comp("a", 1, 0)] })).toBe("sin_componentes");
    expect(revisarPack({ precio: 80, componentes: [comp("a", 3, 0)] })).toBe("precio_no_conviene");
    expect(revisarPack({ precio: 0, componentes: [comp("a", 3, 0)] })).toBe("precio_invalido");
    expect(revisarPack({ precio: 40, componentes: [comp("a", 1, 0), comp("a", 1, 0)] })).toBe(
      "componente_repetido",
    );
  });

  it("el prorrateo suma exacto al centimo", () => {
    const lineas = prorratearPack(59, [
      comp("a", 1, 0, { precioSuelto: 25 }),
      comp("b", 1, 0, { precioSuelto: 25 }),
      comp("c", 1, 0, { precioSuelto: 25 }),
    ]);
    const suma = lineas.reduce((s, l) => s + Math.round(l.precioUnitario * 100) * l.cantidad, 0);
    expect(suma).toBe(5900);
  });
});

describe("arbol de categorias", () => {
  const padres = new Map<string, string | null>([
    ["hombres", null],
    ["boxers", "hombres"],
    ["largos", "boxers"],
  ]);

  it("rechaza meter una categoria dentro de si misma o de su descendiente", () => {
    expect(creariaCiclo("hombres", "largos", padres)).toBe(true);
    expect(creariaCiclo("boxers", "boxers", padres)).toBe(true);
    expect(creariaCiclo("largos", "hombres", padres)).toBe(false);
    expect(creariaCiclo("nueva", null, padres)).toBe(false);
  });
});
