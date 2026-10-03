"use client";

import { IconoFavorito, MenuCuenta } from "@appweb/ui";

/** Productos guardados por el cliente. Aún no hay datos: se ve vacío. */
export function Favoritos() {
  return (
    <MenuCuenta
      onSeccion={() => {}}
      grupos={[
        {
          opciones: [
            { id: "vacio", etiqueta: "Aún no tienes favoritos", icono: <IconoFavorito /> },
          ],
        },
      ]}
    />
  );
}
