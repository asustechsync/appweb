import { describe, expect, it } from "vitest";

import { esquemaBanner, esquemaCupon, esquemaProducto } from "../tipos";
import { planMovimientoManual } from "../stock/manual";
import { skuDeVariante, slugDesdeTexto, varianteRepetida } from "./gestion";

describe("slug y SKU", () => {
  it("el slug no lleva tildes, ñ ni simbolos", () => {
    expect(slugDesdeTexto("  Boxer Pima Niño 2x1 — ¡Oferta! ")).toBe("boxer-pima-nino-2x1-oferta");
    expect(slugDesdeTexto("¡¡¡")).toBe("");
  });

  it("el SKU sigue el formato de la semilla, sin tildes", () => {
    expect(skuDeVariante("medias-premium-xy-mujer", "Única", "Beige")).toBe(
      "MEDIAS-PREMIUM-XY-MUJER-UNICA-BEIGE",
    );
    expect(skuDeVariante("boxer-pima", "M", "Azul marino")).toBe("BOXER-PIMA-M-AZUL-MARINO");
  });

  it("detecta talla y color repetidos sin importar mayusculas ni tildes", () => {
    const existentes = [{ talla: "Única", color: "Negro" }];
    expect(varianteRepetida(existentes, { talla: "unica", color: " NEGRO " })).toBe(true);
    expect(varianteRepetida(existentes, { talla: "Única", color: "Gris" })).toBe(false);
  });
});

describe("esquemaProducto", () => {
  const base = { nombre: "Boxer pima", slug: "boxer-pima", categoriaId: "c1", precio: 29.9 };

  it("acepta un producto sin oferta", () => {
    expect(esquemaProducto.safeParse(base).success).toBe(true);
  });

  it("el precio anterior tiene que ser mayor que el actual", () => {
    const resultado = esquemaProducto.safeParse({ ...base, precioLista: 20 });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.path).toEqual(["precioLista"]);
    expect(esquemaProducto.safeParse({ ...base, precioLista: 39.9 }).success).toBe(true);
  });

  it("rechaza slugs con mayusculas o espacios", () => {
    expect(esquemaProducto.safeParse({ ...base, slug: "Boxer Pima" }).success).toBe(false);
  });
});

describe("planMovimientoManual", () => {
  const base = { varianteId: "v1", stockActual: 10 };

  it("un ingreso suma y la nota es opcional", () => {
    expect(planMovimientoManual({ ...base, tipo: "INGRESO", cantidad: 24 })).toEqual({
      movimiento: { varianteId: "v1", delta: 24, motivo: "INGRESO" },
    });
    expect(planMovimientoManual({ ...base, tipo: "INGRESO", cantidad: 0 })).toEqual({
      rechazo: "cantidad_invalida",
    });
  });

  it("merma y ajuste exigen nota", () => {
    expect(planMovimientoManual({ ...base, tipo: "MERMA", cantidad: 2 })).toEqual({
      rechazo: "falta_nota",
    });
    expect(planMovimientoManual({ ...base, tipo: "AJUSTE", cantidad: 8, nota: " " })).toEqual({
      rechazo: "falta_nota",
    });
  });

  it("la merma resta y no puede pasar del stock", () => {
    expect(planMovimientoManual({ ...base, tipo: "MERMA", cantidad: 2, nota: "Rotos" })).toEqual({
      movimiento: { varianteId: "v1", delta: -2, motivo: "MERMA", nota: "Rotos" },
    });
    expect(planMovimientoManual({ ...base, tipo: "MERMA", cantidad: 11, nota: "x" })).toEqual({
      rechazo: "merma_mayor_que_stock",
    });
  });

  it("el ajuste registra la diferencia contra lo contado", () => {
    expect(planMovimientoManual({ ...base, tipo: "AJUSTE", cantidad: 7, nota: "Conteo" })).toEqual({
      movimiento: { varianteId: "v1", delta: -3, motivo: "AJUSTE", nota: "Conteo" },
    });
    expect(planMovimientoManual({ ...base, tipo: "AJUSTE", cantidad: 10, nota: "Conteo" })).toEqual(
      { rechazo: "ajuste_sin_cambio" },
    );
    expect(planMovimientoManual({ ...base, tipo: "AJUSTE", cantidad: 0, nota: "Robo" })).toEqual({
      movimiento: { varianteId: "v1", delta: -10, motivo: "AJUSTE", nota: "Robo" },
    });
  });

  it("rechaza cantidades no enteras", () => {
    expect(planMovimientoManual({ ...base, tipo: "INGRESO", cantidad: 1.5 })).toEqual({
      rechazo: "cantidad_invalida",
    });
  });
});

describe("esquemas de promociones", () => {
  const banner = {
    etiqueta: "Ofertas",
    titulo: "Tus básicos",
    texto: "Desde S/ 11.90",
    accion: "Ver ofertas",
    href: "/#ofertas",
    orden: 1,
    activo: true,
  };

  it("el banner solo acepta rutas de la tienda", () => {
    expect(esquemaBanner.safeParse(banner).success).toBe(true);
    expect(esquemaBanner.safeParse({ ...banner, href: "https://otro.com" }).success).toBe(false);
    expect(esquemaBanner.safeParse({ ...banner, href: "//otro.com" }).success).toBe(false);
  });

  it("el cupon normaliza el codigo y valida fechas", () => {
    const cupon = {
      codigo: " promo20 ",
      porcentaje: 20,
      minimoCompra: null,
      usosMaximos: null,
      desde: "2026-01-01",
      hasta: "2026-12-31",
      activo: true,
    };
    expect(esquemaCupon.parse(cupon).codigo).toBe("PROMO20");
    expect(esquemaCupon.safeParse({ ...cupon, hasta: "2025-12-31" }).success).toBe(false);
    expect(esquemaCupon.safeParse({ ...cupon, codigo: "con espacio" }).success).toBe(false);
  });
});
