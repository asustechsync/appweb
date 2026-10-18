import { Manrope, Poppins } from "next/font/google";

import { GuionTemaInicial } from "@appweb/ui";

import "./globals.css";

/** Las mismas dos familias que la tienda (ver apps/web/src/app/layout.tsx). */
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
 *  CLASE C — el panel entero. Presupuesto: 0 ms de navegacion.
 *
 *  Este layout monta el documento y nada mas. La unica ruta del panel
 *  (src/app/[[...ruta]]/page.tsx) verifica el token en local (cero viajes a
 *  la base), comprueba que el rol puede entrar y monta el shell una sola vez.
 *
 *  A partir de ahi, cambiar de seccion es navegacion del router del cliente y
 *  los datos salen de la cache de TanStack Query. Quien trabaja en el panel
 *  hace decenas de clics seguidos: si cada uno fuera un render de servidor,
 *  serian 300 ms por clic durante toda la jornada.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const metadata = { title: "Panel" };

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <head>
        <GuionTemaInicial />
      </head>
      <body className={`${manrope.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
