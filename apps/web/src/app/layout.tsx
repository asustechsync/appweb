import type { Metadata, Viewport } from "next";
import { Bai_Jamjuree, Urbanist } from "next/font/google";

import { GuionTemaInicial } from "@appweb/ui";
import { tokens, tokensOscuro } from "@appweb/ui/tokens";

import "./globals.css";

/**
 * Solo los pesos que alguna regla de packages/ui pide de verdad. Cada peso de
 * mas es un archivo que el visitante descarga para nada.
 *
 * Bai Jamjuree es la familia base: 400 es el cuerpo, y 500 y 600 los usan los
 * primitivos. Es estatica, asi que cada peso es su propio archivo (~12 KB del
 * subconjunto latino) y suma al descargar.
 */
const baiJamjuree = Bai_Jamjuree({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-base",
  weight: ["400", "500", "600"],
});

/** Urbanist solo aparece en Precio: 600 el precio y 400 el tachado. */
const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-numeros",
  weight: ["400", "600"],
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
      <body className={`${baiJamjuree.variable} ${urbanist.variable}`}>{children}</body>
    </html>
  );
}
