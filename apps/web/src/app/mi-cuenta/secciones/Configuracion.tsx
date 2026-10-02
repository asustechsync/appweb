"use client";

import { AlternarTema, IconoGlobo, IconoLuna, MenuCuenta } from "@appweb/ui";

/** Preferencias de la cuenta. El tema se guarda en este navegador, no en la base. */
export function Configuracion() {
  return (
    <MenuCuenta
      onSeccion={() => {}}
      grupos={[
        {
          opciones: [
            {
              id: "modo-oscuro",
              etiqueta: "Modo oscuro",
              icono: <IconoLuna />,
              control: <AlternarTema variante="interruptor" />,
            },
            { id: "idioma", etiqueta: "Idioma", icono: <IconoGlobo />, valor: "Español" },
          ],
        },
      ]}
    />
  );
}
