import { describe, expect, it } from "vitest";

import { descuentoDeCupon, normalizarCodigo, revisarCupon, type ReglaCupon } from "./cupones";
import { calcularTotales, igvIncluido, redondear, type LineaCarrito } from "./totales";

function linea(
  precioUnitario: number,
  cantidad: number,
  stock = 10,
  varianteId = "v1",
): LineaCarrito {
  return { varianteId, precioUnitario, cantidad, stock };
}

describe("redondear", () => {
  it("corrige el error de coma flotante", () => {
    expect(redondear(0.1 + 0.2)).toBe(0.3);
    expect(redondear(1.005)).toBe(1.01);
  });
});

describe("igvIncluido", () => {
  it("saca el 18 % que ya va dentro del monto", () => {
    expect(igvIncluido(118)).toBe(18);
    expect(igvIncluido(104.44)).toBe(15.93);
    expect(igvIncluido(0)).toBe(0);
  });
});

describe("calcularTotales", () => {
  it("un carrito vacio da cero", () => {
    const totales = calcularTotales([]);
    expect(totales).toMatchObject({ unidades: 0, subtotal: 0, descuento: 0, total: 0 });
    expect(totales.costoEnvio).toBeNull();
  });

  it("suma unidades y subtotal de todas las lineas", () => {
    const totales = calcularTotales([linea(19.9, 2), linea(9.9, 3, 10, "v2")]);
    expect(totales.unidades).toBe(5);
    expect(totales.subtotal).toBe(69.5);
    expect(totales.total).toBe(69.5);
  });

  it("aplica el cupon sobre el subtotal", () => {
    const totales = calcularTotales([linea(50, 2)], { cupon: { codigo: "X", porcentaje: 10 } });
    expect(totales.descuento).toBe(10);
    expect(totales.total).toBe(90);
  });

  it("el descuento nunca deja el total en negativo", () => {
    const totales = calcularTotales([linea(20, 1)], { cupon: { codigo: "X", porcentaje: 150 } });
    expect(totales.descuento).toBe(20);
    expect(totales.total).toBe(0);
  });

  it("no cobra el envio: el cliente lo paga al courier al recibir", () => {
    const totales = calcularTotales([linea(100, 1)], {
      cupon: { codigo: "X", porcentaje: 10 },
      metodoEnvio: { costo: 22, gratisDesde: null },
    });
    expect(totales.costoEnvio).toBeNull();
    expect(totales.faltaEnvioGratis).toBeNull();
    expect(totales.total).toBe(90);
  });

  it("avisa las lineas que piden mas de lo que hay", () => {
    const totales = calcularTotales([linea(10, 3, 2, "corta"), linea(10, 1, 5, "bien")]);
    expect(totales.lineasSinStock).toEqual(["corta"]);
  });
});

const REGLA: ReglaCupon = {
  codigo: "PROMO10",
  porcentaje: 10,
  activo: true,
  minimoCompra: null,
  usosMaximos: null,
  usos: 0,
  desde: null,
  hasta: null,
};

describe("cupones", () => {
  const ahora = new Date("2026-06-15T12:00:00Z");

  it("normaliza el codigo como se guarda", () => {
    expect(normalizarCodigo("  promo10 ")).toBe("PROMO10");
    expect(normalizarCodigo(null)).toBe("");
  });

  it("acepta un cupon vigente", () => {
    expect(revisarCupon(REGLA, { subtotal: 50, ahora })).toEqual({
      cupon: { codigo: "PROMO10", porcentaje: 10 },
    });
  });

  it("rechaza inexistentes, inactivos, fuera de fecha y agotados", () => {
    expect(revisarCupon(null, { subtotal: 50, ahora })).toEqual({ rechazo: "no_existe" });
    expect(revisarCupon({ ...REGLA, activo: false }, { subtotal: 50, ahora })).toEqual({
      rechazo: "inactivo",
    });
    expect(
      revisarCupon({ ...REGLA, desde: new Date("2026-07-01") }, { subtotal: 50, ahora }),
    ).toEqual({ rechazo: "aun_no_empieza" });
    expect(
      revisarCupon({ ...REGLA, hasta: new Date("2026-06-01") }, { subtotal: 50, ahora }),
    ).toEqual({ rechazo: "vencido" });
    expect(revisarCupon({ ...REGLA, usosMaximos: 3, usos: 3 }, { subtotal: 50, ahora })).toEqual({
      rechazo: "agotado",
    });
  });

  it("respeta el minimo de compra", () => {
    const conMinimo = { ...REGLA, minimoCompra: 100 };
    expect(revisarCupon(conMinimo, { subtotal: 99.9, ahora })).toEqual({
      rechazo: "minimo_no_alcanzado",
    });
    expect("cupon" in revisarCupon(conMinimo, { subtotal: 100, ahora })).toBe(true);
  });

  it("sin cupon no hay descuento", () => {
    expect(descuentoDeCupon(100, null)).toBe(0);
  });

  it("redondea el descuento a centimos", () => {
    expect(descuentoDeCupon(33.33, { codigo: "X", porcentaje: 10 })).toBe(3.33);
  });
});

describe("descuento de nivel", () => {
  it("se aplica solo si no hay cupon", () => {
    const totales = calcularTotales([linea(100, 1)], { descuentoNivelPct: 5 });
    expect(totales.descuento).toBe(5);
    expect(totales.origenDescuento).toBe("nivel");
  });

  it("cupon y nivel no se suman: gana el mayor", () => {
    const cupon = { codigo: "PROMO10", porcentaje: 10 };
    const conCupon = calcularTotales([linea(100, 1)], { cupon, descuentoNivelPct: 5 });
    expect(conCupon.descuento).toBe(10);
    expect(conCupon.origenDescuento).toBe("cupon");

    const ganaNivel = calcularTotales([linea(100, 1)], {
      cupon: { codigo: "X", porcentaje: 5 },
      descuentoNivelPct: 10,
    });
    expect(ganaNivel.descuento).toBe(10);
    expect(ganaNivel.origenDescuento).toBe("nivel");
  });

  it("sin cupon ni nivel no hay origen", () => {
    expect(calcularTotales([linea(100, 1)]).origenDescuento).toBeNull();
  });
});
