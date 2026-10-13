import { Bai_Jamjuree, Poppins, Urbanist } from "next/font/google";

import { GuionTemaInicial } from "@appweb/ui";

import "./globals.css";

/**
 * Las mismas familias que la tienda, para que panel y web se lean igual:
 * Bai Jamjuree de base, Urbanist en los precios y Poppins en el contenido,
 * como /mi-cuenta.
 */
const baiJamjuree = Bai_Jamjuree({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-base",
  weight: ["400", "500", "600"],
});

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-numeros",
  weight: ["400", "600"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-acceso",
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
      <body className={`${baiJamjuree.variable} ${urbanist.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
