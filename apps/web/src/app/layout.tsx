import type { Metadata, Viewport } from "next";

import { URL_TIENDA } from "@appweb/api/urls";
import { DocumentoRaiz } from "@appweb/ui";
import { NOMBRE_MARCA } from "@appweb/ui/marca";
import { tokens, tokensOscuro } from "@appweb/ui/tokens";

import "./globals.css";

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
  title: { default: NOMBRE_MARCA, template: `%s | ${NOMBRE_MARCA}` },
  description: "Boxers, medias y básicos para todos los días. Envíos a todo el Perú.",
  metadataBase: new URL(URL_TIENDA),
  // La imagen sale de app/opengraph-image.tsx; esto pone el resto de la tarjeta.
  openGraph: { type: "website", locale: "es_PE", siteName: NOMBRE_MARCA },
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
  return <DocumentoRaiz>{children}</DocumentoRaiz>;
}
