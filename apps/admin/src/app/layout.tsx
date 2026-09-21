import { GUION_TEMA } from "@appweb/ui";

import "./globals.css";

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
        <script dangerouslySetInnerHTML={{ __html: GUION_TEMA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
