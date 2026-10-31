import { describe, expect, it } from "vitest";

import {
  esquemaAtributo,
  esquemaBanner,
  esquemaCupon,
  esquemaProducto,
  esquemaTipoPrenda,
  esquemaVariantesNuevas,
} from "../tipos";
import { planMovimientoManual } from "../stock/manual";
import {
  codigoDeDiseno,
  COLORES,
  colorRegistrado,
  combinacionesDeVariantes,
  esHex,
  listoParaPublicar,
  mismoNombre,
  requisitosDePublicacion,
  siguienteCodigoColor,
  tipoDeCodigo,
  siguienteCodigoProducto,
  skuDeVariante,
  slugDesdeTexto,
  tipoDesdeNombre,
  TIPOS_PRENDA,
  varianteRepetida,
} from "./gestion";

describe("slug y SKU", () => {
  it("el slug no lleva tildes, ñ ni simbolos", () => {
    expect(slugDesdeTexto("  Boxer Pima Niño 2x1 — ¡Oferta! ")).toBe("boxer-pima-nino-2x1-oferta");
    expect(slugDesdeTexto("¡¡¡")).toBe("");
  });

  it("el tipo de prenda sale del nombre", () => {
    expect(tipoDesdeNombre("Boxer algodón pack x3", TIPOS_PRENDA)).toBe("BX");
    expect(tipoDesdeNombre("Medias térmicas de invierno", TIPOS_PRENDA)).toBe("MD");
    expect(tipoDesdeNombre("Calzón microfibra invisible", TIPOS_PRENDA)).toBe("CZ");
    expect(tipoDesdeNombre("Gorro de lana", TIPOS_PRENDA)).toBe("AC");
    // Un tipo creado en el panel, con palabras escritas con tilde.
    const gorros = [{ codigo: "GO", palabras: ["Gorro"] }];
    expect(tipoDesdeNombre("Gorro de lana", gorros)).toBe("GO");
  });

  it("el codigo de modelo sigue al mayor de su tipo y no rellena huecos", () => {
    expect(siguienteCodigoProducto("BX", [])).toBe("BX001");
    expect(siguienteCodigoProducto("BX", ["BX001", "BX012", "MD030"])).toBe("BX013");
  });

  it("el SKU es modelo, talla y color con diseño", () => {
    expect(skuDeVariante("BX012", "M", "11", 2)).toBe("BX012-M-112");
    expect(skuDeVariante("MD007", "35-40", "01", 1)).toBe("MD007-3540-011");
    expect(skuDeVariante("GU003", "Única", "01", 1)).toBe("GU003-U-011");
    expect(skuDeVariante("BR005", "34b", "30", 2)).toBe("BR005-34B-302");
  });

  it("los colores se reconocen sin importar mayusculas ni tildes", () => {
    expect(colorRegistrado(" azul MARINO ", COLORES)?.codigo).toBe("11");
    expect(colorRegistrado("cafe", COLORES)?.codigo).toBe("32");
    expect(colorRegistrado("Plateado", COLORES)).toBeNull();
    expect(mismoNombre("Más vendido", " mas VENDIDO")).toBe(true);
  });

  it("un color nuevo toma el siguiente numero de su familia", () => {
    const usados = COLORES.map((c) => c.codigo);
    expect(siguienteCodigoColor(1, usados)).toBe("14");
    expect(siguienteCodigoColor(7, usados)).toBe("70");
    expect(siguienteCodigoColor(0, [])).toBe("01");
    expect(siguienteCodigoColor(9, ["99"])).toBeNull();
    expect(esHex("#1e2a4a")).toBe(true);
    expect(esHex("1E2A4A")).toBe(false);
  });

  it("el diseño se numera dentro del producto", () => {
    const existentes = [
      { diseno: "Liso", disenoCodigo: 1 },
      { diseno: "Rayas", disenoCodigo: 2 },
    ];
    expect(codigoDeDiseno([], "Liso")).toBe(1);
    expect(codigoDeDiseno(existentes, "rayas")).toBe(2);
    expect(codigoDeDiseno(existentes, "Encaje")).toBe(3);
    expect(codigoDeDiseno([{ diseno: "X", disenoCodigo: 9 }], "Otro")).toBeNull();
  });

  it("detecta talla, color y diseño repetidos sin importar mayusculas ni tildes", () => {
    const existentes = [{ talla: "Única", color: "Negro", diseno: "Liso" }];
    expect(varianteRepetida(existentes, { talla: "unica", color: " NEGRO ", diseno: "liso" })).toBe(
      true,
    );
    expect(varianteRepetida(existentes, { talla: "Única", color: "Negro", diseno: "Rayas" })).toBe(
      false,
    );
  });
});

describe("variantes en bloque", () => {
  it("cruza tallas y colores y salta las que ya existen o se repiten", () => {
    const existentes = [{ talla: "M", color: "Negro", diseno: "Liso" }];
    const r = combinacionesDeVariantes(existentes, {
      tallas: ["S", "M", "m"],
      colores: ["Negro", "Blanco"],
      diseno: "Liso",
    });
    expect(r.nuevas).toEqual([
      { talla: "S", color: "Negro", diseno: "Liso" },
      { talla: "S", color: "Blanco", diseno: "Liso" },
      { talla: "M", color: "Blanco", diseno: "Liso" },
    ]);
    expect(r.yaExistian).toBe(1);
  });

  it("el esquema pone Liso si no hay diseño y exige tallas y colores", () => {
    const base = {
      productoId: "p1",
      tallas: ["M"],
      colores: ["Negro"],
      diseno: " ",
      stockInicial: 0,
    };
    expect(esquemaVariantesNuevas.parse(base).diseno).toBe("Liso");
    expect(esquemaVariantesNuevas.safeParse({ ...base, colores: [] }).success).toBe(false);
    expect(esquemaVariantesNuevas.safeParse({ ...base, tallas: [] }).success).toBe(false);
  });

  it("el tipo sale del codigo de modelo", () => {
    expect(tipoDeCodigo("BX008")).toBe("BX");
    expect(tipoDeCodigo("GO001")).toBe("GO");
    expect(tipoDeCodigo(null)).toBeNull();
  });
});

describe("atributos", () => {
  it("el tipo de prenda lleva dos letras y al menos una talla, sin repetir", () => {
    const tipo = esquemaTipoPrenda.parse({
      codigo: " go ",
      nombre: "Gorros",
      tallas: ["Única", "Única", " "],
      palabras: [],
      orden: 0,
    });
    expect(tipo.codigo).toBe("GO");
    expect(tipo.tallas).toEqual(["Única"]);
    expect(
      esquemaTipoPrenda.safeParse({ ...tipo, codigo: "GOR" }).success ||
        esquemaTipoPrenda.safeParse({ ...tipo, tallas: [] }).success,
    ).toBe(false);
  });

  it("un color nuevo pide su familia; diseños y etiquetas no", () => {
    const base = { clase: "COLOR" as const, nombre: "Plateado", orden: 0 };
    expect(esquemaAtributo.safeParse(base).success).toBe(false);
    expect(esquemaAtributo.safeParse({ ...base, familia: 0 }).success).toBe(true);
    expect(esquemaAtributo.safeParse({ ...base, familia: 8 }).success).toBe(false);
    expect(esquemaAtributo.safeParse({ ...base, clase: "DISENO" }).success).toBe(true);
  });
});

describe("requisitos de publicacion", () => {
  const base = { precio: 29.9, variantes: [], fotosPropias: 0, descripcionCorta: "" };

  it("sin una variante con stock no se puede publicar", () => {
    expect(listoParaPublicar(requisitosDePublicacion(base))).toBe(false);
    const oculta = { ...base, variantes: [{ activo: false, stock: 5 }] };
    expect(listoParaPublicar(requisitosDePublicacion(oculta))).toBe(false);
  });

  it("la foto y el resumen se recomiendan pero no bloquean", () => {
    const lista = requisitosDePublicacion({ ...base, variantes: [{ activo: true, stock: 3 }] });
    expect(listoParaPublicar(lista)).toBe(true);
    expect(lista.filter((r) => !r.cumplido).map((r) => r.id)).toEqual(["foto", "resumen"]);
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
