import { Manrope, Poppins } from "next/font/google";
import type { ReactNode } from "react";

import { GuionTemaInicial } from "./GuionTemaInicial";

/**
 * Las dos unicas familias del proyecto (ver `tipo.familia` en tokens.ts). Se
 * declaran aqui una sola vez para la tienda y el panel: ningun layout ni
 * pagina carga fuentes propias.
 *
 * Manrope es variable: un solo archivo cubre todos los pesos. Poppins es
 * estatica, asi que solo los pesos que piden los primitivos: cada uno es un
 * archivo que el visitante descarga.
 */
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-texto",
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-titulos",
  weight: ["400", "500", "600"],
});

/**
 * El documento de las dos apps: idioma, guion del tema y fuentes. Cada layout
 * raiz solo lo envuelve; si cambia algo del documento, cambia para las dos.
 *
 * `suppressHydrationWarning`: el guion del tema fija `data-tema` en <html>
 * antes de la hidratacion, asi que el atributo difiere del HTML del servidor.
 * Es el unico punto donde esa diferencia es intencional.
 */
export function DocumentoRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      {/* biome-ignore lint/style/noHeadElement: es el <head> del layout raiz del App Router, no next/head */}
      <head>
        <GuionTemaInicial />
      </head>
      <body className={`${manrope.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
