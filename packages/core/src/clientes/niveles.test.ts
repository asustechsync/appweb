import { describe, expect, it } from "vitest";

import {
  clientesPorNivel,
  impactoDeNiveles,
  NIVELES_INICIALES,
  nivelPorCompras,
  revisarNiveles,
  textoQueFalta,
  type Nivel,
} from "./niveles";

const NIVELES = NIVELES_INICIALES;

/** Copia de los niveles iniciales con algunos campos cambiados. */
function con(cambios: Partial<Record<Nivel["id"], Partial<Nivel>>>): Nivel[] {
  return NIVELES.map((nivel) => ({ ...nivel, ...cambios[nivel.id] }));
}

describe("nivelPorCompras", () => {
  it("toda cuenta nueva empieza en Básico", () => {
    expect(nivelPorCompras({ total: 0, pedidos: 0 }, NIVELES).nivel.id).toBe("BASICO");
  });

  it("sube solo si cumple monto y pedidos a la vez", () => {
    expect(nivelPorCompras({ total: 300, pedidos: 3 }, NIVELES).nivel.id).toBe("BRONCE");
    expect(nivelPorCompras({ total: 1500, pedidos: 12 }, NIVELES).nivel.id).toBe("PLATINO");
  });

  it("una sola compra grande no basta", () => {
    expect(nivelPorCompras({ total: 2000, pedidos: 1 }, NIVELES).nivel.id).toBe("BASICO");
    expect(nivelPorCompras({ total: 2000, pedidos: 5 }, NIVELES).nivel.id).toBe("PLATA");
  });

  it("muchos pedidos chicos tampoco", () => {
    expect(nivelPorCompras({ total: 200, pedidos: 20 }, NIVELES).nivel.id).toBe("BASICO");
  });

  it("dice cuanto falta de cada requisito y avanza con el mas atrasado", () => {
    const bronce = nivelPorCompras({ total: 550, pedidos: 4 }, NIVELES);
    expect(bronce.nivel.id).toBe("BRONCE");
    expect(bronce.siguiente?.nivel.id).toBe("PLATA");
    expect(bronce.siguiente?.falta).toBe(0);
    expect(bronce.siguiente?.faltanPedidos).toBe(1);
    // Monto completo (100%) pero pedidos a mitad (50%): manda el mas atrasado.
    expect(bronce.progresoPct).toBe(50);
  });

  it("en el ultimo nivel no hay siguiente", () => {
    const platino = nivelPorCompras({ total: 3000, pedidos: 20 }, NIVELES);
    expect(platino.siguiente).toBeNull();
    expect(platino.progresoPct).toBe(100);
  });
});

describe("revisarNiveles", () => {
  it("acepta los niveles iniciales", () => {
    expect(revisarNiveles(NIVELES)).toBeNull();
  });

  it("Básico empieza en S/ 0 y 0 pedidos", () => {
    expect(revisarNiveles(con({ BASICO: { desde: 50 } }))).toMatch(/toda cuenta nueva/);
    expect(revisarNiveles(con({ BASICO: { pedidosMinimos: 1 } }))).toMatch(/toda cuenta nueva/);
  });

  it("cada nivel pide mas monto que el anterior", () => {
    expect(revisarNiveles(con({ ORO: { desde: 500 } }))).toMatch(/más monto que Plata/);
  });

  it("un nivel no pide menos pedidos que el anterior", () => {
    expect(revisarNiveles(con({ ORO: { pedidosMinimos: 4 } }))).toMatch(/menos pedidos que Plata/);
  });

  it("un nivel mas alto no descuenta menos", () => {
    expect(revisarNiveles(con({ PLATINO: { descuentoPct: 6 } }))).toMatch(
      /no puede descontar menos/,
    );
  });

  it("descuento y pedidos son enteros", () => {
    expect(revisarNiveles(con({ ORO: { descuentoPct: 101 } }))).toMatch(/entre 0 y 100/);
    expect(revisarNiveles(con({ PLATA: { descuentoPct: 5.5 } }))).toMatch(/entero/);
    expect(revisarNiveles(con({ PLATA: { pedidosMinimos: 4.5 } }))).toMatch(/entero/);
  });

  it("pide nombre y beneficio", () => {
    expect(revisarNiveles(con({ PLATA: { nombre: " " } }))).toMatch(/nombre/);
    expect(revisarNiveles(con({ PLATA: { beneficio: "" } }))).toMatch(/beneficio/);
  });

  it("son cinco niveles fijos, en orden", () => {
    expect(revisarNiveles(NIVELES.slice(0, 3))).toMatch(/Básico, Bronce, Plata, Oro y Platino/);
    expect(revisarNiveles([...NIVELES].reverse())).toMatch(/en ese orden/);
  });
});

describe("clientesPorNivel", () => {
  it("cuenta cuantos clientes hay en cada nivel", () => {
    const compras = [
      { total: 0, pedidos: 0 },
      { total: 900, pedidos: 1 },
      { total: 320, pedidos: 3 },
      { total: 600, pedidos: 5 },
      { total: 1000, pedidos: 9 },
      { total: 1600, pedidos: 12 },
    ];
    expect(clientesPorNivel(compras, NIVELES)).toEqual({
      BASICO: 2,
      BRONCE: 1,
      PLATA: 1,
      ORO: 1,
      PLATINO: 1,
    });
  });
});

describe("impactoDeNiveles", () => {
  const compras = [
    { total: 0, pedidos: 0 },
    { total: 260, pedidos: 3 },
    { total: 290, pedidos: 4 },
    { total: 560, pedidos: 5 },
    { total: 1600, pedidos: 12 },
  ];

  it("bajar un requisito solo hace subir", () => {
    expect(impactoDeNiveles(compras, NIVELES, con({ BRONCE: { desde: 250 } }))).toEqual({
      suben: 2,
      bajan: 0,
    });
  });

  it("subir un requisito hace bajar a quien ya no llega", () => {
    expect(impactoDeNiveles(compras, NIVELES, con({ PLATA: { pedidosMinimos: 6 } }))).toEqual({
      suben: 0,
      bajan: 1,
    });
  });

  it("cambiar solo el descuento no mueve a nadie", () => {
    expect(impactoDeNiveles(compras, NIVELES, con({ ORO: { descuentoPct: 8 } }))).toEqual({
      suben: 0,
      bajan: 0,
    });
  });
});

describe("textoQueFalta", () => {
  it("junta monto y pedidos que faltan", () => {
    const siguiente = nivelPorCompras({ total: 180, pedidos: 1 }, NIVELES).siguiente;
    expect(siguiente && textoQueFalta(siguiente)).toMatch(/120.*y 2 pedidos/);
  });

  it("omite lo que ya se cumple", () => {
    const siguiente = nivelPorCompras({ total: 550, pedidos: 4 }, NIVELES).siguiente;
    expect(siguiente && textoQueFalta(siguiente)).toBe("1 pedido");
  });
});
