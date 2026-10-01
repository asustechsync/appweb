import { Poppins } from "next/font/google";

/**
 * Poppins para el carrito: se carga aqui y no en el layout raiz para que el
 * resto del sitio no descargue estos archivos.
 */
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export default function LayoutCarrito({ children }: { children: React.ReactNode }) {
  // La variable vive aqui y no en globals.css: alli se resolveria en <body>,
  // que es antes de que exista la fuente cargada por este layout.
  const estilo = { "--tipo-familia-acceso": `${poppins.style.fontFamily}, system-ui, sans-serif` };
  return <div style={estilo as React.CSSProperties}>{children}</div>;
}
