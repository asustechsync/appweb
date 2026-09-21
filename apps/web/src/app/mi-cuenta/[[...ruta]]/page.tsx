import { redirect } from "next/navigation";

import { leerSesion } from "@/lib/sesion";

import { MiCuenta } from "../MiCuenta";
import { Proveedores } from "../Proveedores";

/**
 * CLASE C — mi cuenta. Presupuesto: 0 ms de navegacion.
 *
 * Esta ruta se monta UNA vez: comprueba la sesion y entrega el shell. A partir
 * de ahi la navegacion entre secciones (perfil, direcciones, pedidos,
 * seguridad) es del cliente y los datos salen de la cache de TanStack Query,
 * hablando con /api/trpc — el servidor solo entrega JSON.
 */

// Leer la cookie hace dinamica esta hoja, que es lo correcto: la cuenta es
// distinta para cada visitante y no se cachea nunca.
export const instant = false;

export const metadata = { title: "Mi cuenta" };

const SECCIONES = ["perfil", "direcciones", "pedidos", "seguridad"];

interface Props {
  params: Promise<{ ruta?: string[] }>;
}

export default async function PaginaMiCuenta({ params }: Props) {
  const { ruta } = await params;
  const sesion = await leerSesion();

  if (sesion === null) {
    const destino = ruta?.[0] ? `/mi-cuenta/${ruta[0]}` : "/mi-cuenta";
    redirect(`/ingresar?next=${encodeURIComponent(destino)}`);
  }

  const pedida = ruta?.[0];
  const inicial = pedida && SECCIONES.includes(pedida) ? pedida : "perfil";

  return (
    <Proveedores>
      <MiCuenta nombre={sesion.nombre} rol={sesion.rol} seccionInicial={inicial} />
    </Proveedores>
  );
}
