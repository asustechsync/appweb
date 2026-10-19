"use client";

import { Boton, EstadoVacio } from "@appweb/ui";

import "./globals.css";

/**
 * Ultimo recurso: falla el layout raiz. Reemplaza el documento entero, asi que
 * trae su propio <html> y <body>. Sin las fuentes del layout (cae a las del
 * sistema): mejor una pagina sencilla que ninguna.
 */
export default function ErrorGlobal({ retry }: { error: Error; retry: () => void }) {
  return (
    <html lang="es-PE">
      <body>
        <title>Algo salió mal</title>
        <EstadoVacio
          titulo="Algo salió mal"
          texto="La tienda no está disponible en este momento. Inténtalo de nuevo en unos minutos."
          accion={<Boton onClick={() => retry()}>Reintentar</Boton>}
        />
      </body>
    </html>
  );
}
