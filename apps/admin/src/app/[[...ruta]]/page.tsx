import { cookies } from "next/headers";
import { connection } from "next/server";

import { COOKIE_SESION, sesionDesdeToken } from "@appweb/api";
import { puede, seccionesDelPanel } from "@appweb/core";
import { EstadoVacio } from "@appweb/ui";

import { Proveedores } from "@/app/Proveedores";
import { Panel } from "@/secciones/Panel";
import { URL_TIENDA } from "@appweb/api/urls";

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

interface Props {
  params: Promise<{ ruta?: string[] }>;
}

export default async function PaginaPanel({ params }: Props) {
  // Verificar el token usa `Date.now()` (vence a los 30 dias). Con cache
  // components, Next exige declarar antes que esto se resuelve en cada visita:
  // `connection()` lo marca asi, y la cookie ya lo era.
  await connection();
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
  // Sin seccion: en movil se ve el menu; en escritorio, la primera.
  const inicial = pedida && secciones.includes(pedida) ? pedida : "";

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
