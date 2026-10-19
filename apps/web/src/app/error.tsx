"use client";

import { useEffect } from "react";

import { Boton, Contenedor, EstadoVacio } from "@appweb/ui";

/**
 * Error inesperado en cualquier pagina de la tienda. `retry` vuelve a pedir
 * la pagina al servidor; si el fallo era pasajero (la base tardo), con eso
 * basta.
 */
export default function ErrorTienda({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // El `digest` es el que aparece en el log del servidor: con el se busca la causa.
    console.error("Error en la tienda", error.digest ?? "", error);
  }, [error]);

  return (
    <Contenedor>
      <EstadoVacio
        titulo="Algo salió mal"
        texto="No pudimos cargar esta página. Inténtalo de nuevo en unos segundos."
        accion={<Boton onClick={() => retry()}>Reintentar</Boton>}
      />
    </Contenedor>
  );
}
