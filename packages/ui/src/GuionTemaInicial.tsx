"use client";

import { GUION_TEMA } from "./tema";

/**
 * Ejecuta el tema guardado antes del primer pintado sin que React intente
 * volver a ejecutar el script al hidratar en el navegador.
 */
export function GuionTemaInicial() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      // biome-ignore lint/security/noDangerouslySetInnerHtml: GUION_TEMA es codigo propio y fijo; debe correr antes de hidratar para no parpadear.
      dangerouslySetInnerHTML={{ __html: GUION_TEMA }}
    />
  );
}
