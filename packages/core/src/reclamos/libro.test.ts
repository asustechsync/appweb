import { describe, expect, it } from "vitest";

import { codigoReclamo, diasParaVencer, revisarRespuesta, venceReclamo } from "./libro";

/** Fecha en hora de Lima (UTC-5), escrita como la leeria una persona. */
function lima(texto: string): Date {
  return new Date(`${texto}-05:00`);
}

describe("libro de reclamaciones", () => {
  it("numera la hoja con seis cifras y el año", () => {
    expect(codigoReclamo(7, lima("2026-10-19T10:00:00"))).toBe("000007-2026");
    expect(codigoReclamo(123456, lima("2027-01-02T10:00:00"))).toBe("123456-2027");
  });

  it("toma el año de Lima aunque en UTC ya sea el siguiente", () => {
    expect(codigoReclamo(1, lima("2026-12-31T22:00:00"))).toBe("000001-2026");
  });

  it("da 15 dias habiles saltando fines de semana", () => {
    // Lunes 19 de octubre -> 15 habiles desde el martes 20 = lunes 9 de noviembre.
    const vence = venceReclamo(lima("2026-10-19T10:00:00"));
    expect(vence.toISOString()).toBe(lima("2026-11-09T23:59:59.999").toISOString());
  });

  it("cuenta el dia en hora de Lima, no en la del servidor", () => {
    // Viernes 23 a las 8 pm en Lima (ya sabado en UTC) cuenta desde el lunes 26.
    const vence = venceReclamo(lima("2026-10-23T20:00:00"));
    expect(vence.toISOString()).toBe(lima("2026-11-13T23:59:59.999").toISOString());
  });

  it("dice cuantos dias faltan y se vuelve negativo al vencer", () => {
    const creado = lima("2026-10-19T10:00:00");
    expect(diasParaVencer(creado, lima("2026-11-09T10:00:00"))).toBe(1);
    expect(diasParaVencer(creado, lima("2026-11-12T10:00:00"))).toBeLessThan(0);
  });

  it("no deja responder dos veces", () => {
    expect(revisarRespuesta("PENDIENTE")).toBeNull();
    expect(revisarRespuesta("RESPONDIDO")).toBe("ya_respondido");
  });
});
