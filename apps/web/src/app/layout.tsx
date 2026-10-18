import type { Metadata, Viewport } from "next";
import { Manrope, Poppins } from "next/font/google";

import { GuionTemaInicial } from "@appweb/ui";
import { tokens, tokensOscuro } from "@appweb/ui/tokens";

import "./globals.css";

/**
 * Las dos unicas familias del proyecto (ver `tipo.familia` en tokens.ts). Se
 * cargan aqui una sola vez: ningun layout ni pagina carga fuentes propias.
 *
 * Manrope es variable: un solo archivo cubre todos los pesos. Poppins es
 * estatica, asi que solo los pesos que pide packages/ui: cada uno es un
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
 * ═══════════════════════════════════════════════════════════════════════════
 *  LAYOUT RAIZ — REGLA CRITICA
 *
 *  Aqui NO se leen cookies(), headers() ni la sesion.
 *
 *  Leer una cookie en el layout raiz vuelve dinamico TODO el arbol de rutas,
 *  portada y categorias incluidas. Ahi se pierden los 20 ms: el sitio sigue
 *  funcionando, solo que deja de servirse desde el CDN.
 *
 *  El estado de sesion entra por una isla cliente dentro de la cabecera.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const metadata: Metadata = {
  title: { default: "Tienda", template: "%s | Tienda" },
  description: "Boxers, medias y basicos.",
  metadataBase: new URL(process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: tokens.color.fondo },
    { media: "(prefers-color-scheme: dark)", color: tokensOscuro.color.fondo },
  ],
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  // `suppressHydrationWarning`: el guion del tema fija `data-tema` en <html>
  // antes de la hidratacion, asi que el atributo difiere del HTML del
  // servidor. Es el unico punto donde esa diferencia es intencional.
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <head>
        <GuionTemaInicial />
      </head>
      <body className={`${manrope.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
