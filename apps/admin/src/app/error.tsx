"use client";

import { useEffect } from "react";

import { Boton, EstadoVacio } from "@appweb/ui";

/** Error inesperado en el panel. `retry` vuelve a pedir la pagina al servidor. */
export default function ErrorPanel({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Error en el panel", error.digest ?? "", error);
  }, [error]);

  return (
    <EstadoVacio
      titulo="Algo salió mal"
      texto="No pudimos cargar el panel. Inténtalo de nuevo; si sigue fallando, revisa el log del servidor."
      accion={<Boton onClick={() => retry()}>Reintentar</Boton>}
    />
  );
}
