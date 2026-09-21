import { cookies } from "next/headers";

import { COOKIE_SESION, sesionDesdeToken } from "@appweb/api";
import { puede, seccionesDelPanel } from "@appweb/core";
import { EstadoVacio } from "@appweb/ui";

import { Proveedores } from "@/app/Proveedores";
import { Panel } from "@/secciones/Panel";

/**
 * Unica ruta del panel: todo lo demas navega en el cliente.
 *
 * Aqui se verifica el token (en local, sin tocar la base) y que el rol pueda
 * entrar al panel. Pasado ese filtro se monta el shell una sola vez; a partir
 * de ahi las secciones son estado del cliente.
 *
 * Que secciones ve cada rol lo decide `seccionesDelPanel` de @appweb/core.
 */

// Leer la cookie hace esta ruta dinamica, que es exactamente lo que queremos:
// el panel entero vive detras de una sesion y nunca se sirve cacheado.
export const instant = false;

const URL_TIENDA = process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000";

interface Props {
  params: Promise<{ ruta?: string[] }>;
}

export default async function PaginaPanel({ params }: Props) {
  const { ruta } = await params;

  const almacen = await cookies();
  const sesion = sesionDesdeToken(almacen.get(COOKIE_SESION)?.value);

  if (sesion === null) {
    return (
      <EstadoVacio
        titulo="Necesitas iniciar sesión"
        texto="Entra con tu cuenta para abrir el panel."
        textoAccion="Ir a iniciar sesión"
        hrefAccion={`${URL_TIENDA}/ingresar`}
      />
    );
  }

  if (!puede(sesion.rol, "entrar_panel")) {
    return (
      <EstadoVacio
        titulo="Tu cuenta no tiene acceso al panel"
        texto="Pídele a un administrador que te asigne un rol con acceso."
        textoAccion="Volver a la tienda"
        hrefAccion={URL_TIENDA}
      />
    );
  }

  const secciones = seccionesDelPanel(sesion.rol);
  const pedida = ruta?.[0];
  const inicial = pedida && secciones.includes(pedida) ? pedida : (secciones[0] ?? "resumen");

  return (
    <Proveedores>
      <Panel
        secciones={secciones}
        seccionInicial={inicial}
        usuarioId={sesion.usuarioId}
        nombre={sesion.nombre}
        rol={sesion.rol}
      />
    </Proveedores>
  );
}
