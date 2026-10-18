import { describe, expect, it } from "vitest";

import { departamentosDesdeTexto } from "../envios/zonas";
import { revisarDespacho } from "../pedidos/gestion";
import { esquemaEdicionUsuario } from "../tipos";
import { datosAnonimos, estaAnonimizada } from "./administracion";
import {
  crearTokenRecuperacion,
  DURACION_RECUPERACION_MS,
  usuarioDeTokenRecuperacion,
  verificarTokenRecuperacion,
} from "./recuperacion";

const SECRETO = "secreto-de-prueba";
const HASH = "sal:hash-actual";

describe("enlace de recuperacion", () => {
  const ahora = 1_000_000;
  const token = crearTokenRecuperacion("u1", HASH, SECRETO, ahora);

  it("dice de quien es y se verifica con la clave actual", () => {
    expect(usuarioDeTokenRecuperacion(token, ahora)).toBe("u1");
    expect(verificarTokenRecuperacion(token, HASH, SECRETO, ahora)).toBe(true);
  });

  it("deja de valer cuando la clave cambia: sirve una sola vez", () => {
    expect(verificarTokenRecuperacion(token, "sal:hash-nuevo", SECRETO, ahora)).toBe(false);
  });

  it("caduca a la hora", () => {
    const despues = ahora + DURACION_RECUPERACION_MS + 1;
    expect(usuarioDeTokenRecuperacion(token, despues)).toBeNull();
    expect(verificarTokenRecuperacion(token, HASH, SECRETO, despues)).toBe(false);
  });

  it("rechaza un enlace alterado o firmado con otro secreto", () => {
    const [cuerpo, firma] = token.split(".");
    const otroCuerpo = Buffer.from(JSON.stringify({ u: "admin", e: ahora + 5000 })).toString(
      "base64url",
    );
    expect(verificarTokenRecuperacion(`${otroCuerpo}.${firma}`, HASH, SECRETO, ahora)).toBe(false);
    expect(verificarTokenRecuperacion(`${cuerpo}.${firma}`, HASH, "otro-secreto", ahora)).toBe(
      false,
    );
    expect(usuarioDeTokenRecuperacion("basura", ahora)).toBeNull();
  });
});

describe("anonimizar", () => {
  it("borra los datos personales y deja la cuenta sin acceso", () => {
    const datos = datosAnonimos("abc", "hash-inutil");
    expect(datos.email).toBe("eliminado-abc@anonimo.invalid");
    expect(datos.telefono).toBeNull();
    expect(datos.numeroDocumento).toBeNull();
    expect(datos.activo).toBe(false);
    expect(estaAnonimizada(datos.email)).toBe(true);
    expect(estaAnonimizada("ana@correo.pe")).toBe(false);
  });
});

describe("despacho", () => {
  it("el almacen prepara, envia y entrega", () => {
    expect(revisarDespacho({ desde: "PAGADO", hacia: "PREPARANDO", medio: "YAPE" })).toBeNull();
    expect(revisarDespacho({ desde: "PREPARANDO", hacia: "ENVIADO", medio: "YAPE" })).toBeNull();
    expect(revisarDespacho({ desde: "ENVIADO", hacia: "ENTREGADO", medio: "YAPE" })).toBeNull();
  });

  it("no cancela ni confirma pedidos contra entrega", () => {
    expect(revisarDespacho({ desde: "PAGADO", hacia: "CANCELADO", medio: "YAPE" })).toBe(
      "fuera_del_despacho",
    );
    expect(
      revisarDespacho({ desde: "PENDIENTE_PAGO", hacia: "PREPARANDO", medio: "CONTRA_ENTREGA" }),
    ).toBe("fuera_del_despacho");
  });
});

describe("departamentosDesdeTexto", () => {
  it("separa por comas sin vacios ni repetidos", () => {
    expect(departamentosDesdeTexto(" Lima, Callao ,, lima, Junín ")).toEqual([
      "Lima",
      "Callao",
      "Junín",
    ]);
    expect(departamentosDesdeTexto("  ")).toEqual([]);
  });
});

describe("esquemaEdicionUsuario", () => {
  it("normaliza el correo y valida el telefono", () => {
    const ok = esquemaEdicionUsuario.parse({
      usuarioId: "u1",
      nombre: "Ana",
      email: "ANA@Correo.PE",
      telefono: "987654321",
    });
    expect(ok.email).toBe("ana@correo.pe");
    expect(
      esquemaEdicionUsuario.safeParse({
        usuarioId: "u1",
        nombre: "Ana",
        email: "a@b.pe",
        telefono: "9x",
      }).success,
    ).toBe(false);
  });
});
