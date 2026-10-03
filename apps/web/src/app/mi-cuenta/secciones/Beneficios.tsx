"use client";

import { IconoEtiqueta, MenuCuenta } from "@appweb/ui";

/** Beneficios de la cuenta. Hoy solo el cupón de bienvenida PROMO10. */
export function Beneficios() {
  return (
    <MenuCuenta
      onSeccion={() => {}}
      grupos={[
        {
          opciones: [
            { id: "cupon", etiqueta: "Cupón de bienvenida", icono: <IconoEtiqueta />, valor: "PROMO10" },
          ],
        },
      ]}
    />
  );
}
