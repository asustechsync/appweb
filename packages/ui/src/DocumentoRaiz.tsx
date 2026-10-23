import { Bai_Jamjuree, Manrope, Poppins } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { GuionTemaInicial } from "./GuionTemaInicial";

/**
 * Las familias del proyecto (ver `tipo.familia` en tokens.ts): Manrope y
 * Poppins, mas dos solo para la cifra grande de `TarjetaMetrica`: Satoshi
 * (digitos) y Bai Jamjuree (simbolo de moneda). Se
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

// Satoshi no esta en Google Fonts: el archivo vive en `./fuentes`. Un solo peso
// (no hay 600: la cifra pide 600 y el navegador toma este 700),
// solo los digitos de la cifra grande de `TarjetaMetrica`.
const satoshi = localFont({
  src: "./fuentes/Satoshi-Bold.woff",
  weight: "700",
  display: "swap",
  variable: "--fuente-cifras",
});

// Un solo peso: solo el "S/" de la cifra grande de `TarjetaMetrica`.
const baiJamjuree = Bai_Jamjuree({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-moneda",
  weight: ["600"],
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
      <body
        className={`${manrope.variable} ${poppins.variable} ${satoshi.variable} ${baiJamjuree.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
