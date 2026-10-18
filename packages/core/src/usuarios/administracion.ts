/**
 * Que cambios sobre una cuenta estan permitidos.
 *
 * Son dos reglas, y las dos existen para que nadie se quede fuera del panel:
 *
 *   1. Nadie se toca a si mismo. Un admin que se degrada por error pierde el
 *      acceso y ya no puede deshacerlo.
 *   2. Siempre queda un ADMIN activo. Si se puede degradar o desactivar al
 *      ultimo, la tienda se queda sin nadie que gestione usuarios y el arreglo
 *      pasa por entrar a la base a mano.
 *
 * Viven aqui y no en la ruta del panel porque la app movil y cualquier otra
 * pantalla que gestione usuarios tienen que rechazar exactamente lo mismo.
 */

import type { Rol } from "./permisos";

export type RechazoGestionUsuario = "es_uno_mismo" | "ultimo_admin";

const MENSAJES: Record<RechazoGestionUsuario, string> = {
  es_uno_mismo: "No puedes cambiar tu propia cuenta desde el panel.",
  ultimo_admin: "Tiene que quedar al menos un administrador activo.",
};

export function mensajeDeRechazo(motivo: RechazoGestionUsuario): string {
  return MENSAJES[motivo];
}

interface EntradaCambioRol {
  actorId: string;
  objetivoId: string;
  rolActual: Rol;
  rolNuevo: Rol;
  /** Cuantos ADMIN activos hay ahora mismo, contando al objetivo. */
  adminsActivos: number;
}

/** `null` si el cambio se puede hacer. */
export function revisarCambioRol(entrada: EntradaCambioRol): RechazoGestionUsuario | null {
  const { actorId, objetivoId, rolActual, rolNuevo, adminsActivos } = entrada;

  if (actorId === objetivoId) return "es_uno_mismo";

  const dejaDeSerAdmin = rolActual === "ADMIN" && rolNuevo !== "ADMIN";
  if (dejaDeSerAdmin && adminsActivos <= 1) return "ultimo_admin";

  return null;
}

interface EntradaDesactivacion {
  actorId: string;
  objetivoId: string;
  rolActual: Rol;
  adminsActivos: number;
}

/**
 * `null` si la cuenta se puede desactivar. Reactivar no se revisa: devolver el
 * acceso a alguien nunca deja a la tienda sin administradores.
 */
export function revisarDesactivacion(entrada: EntradaDesactivacion): RechazoGestionUsuario | null {
  const { actorId, objetivoId, rolActual, adminsActivos } = entrada;

  if (actorId === objetivoId) return "es_uno_mismo";
  if (rolActual === "ADMIN" && adminsActivos <= 1) return "ultimo_admin";

  return null;
}

/**
 * "Eliminar" una cuenta es anonimizarla: se borran los datos personales y el
 * acceso, pero la fila queda porque sus pedidos, pagos y movimientos la
 * referencian. La venta de ayer no puede quedar sin cliente; solo deja de
 * saberse quien era. Pasa las mismas reglas que desactivar
 * (`revisarDesactivacion`).
 *
 * `claveInutil` la arma quien llama (un hash de algo aleatorio): nadie puede
 * volver a entrar con esta cuenta.
 */
export function datosAnonimos(usuarioId: string, claveInutil: string) {
  return {
    email: `eliminado-${usuarioId}@anonimo.invalid`,
    clave: claveInutil,
    nombre: "Cuenta eliminada",
    apellidoPaterno: null,
    apellidoMaterno: null,
    apodo: null,
    telefono: null,
    fechaNacimiento: null,
    genero: null,
    tipoDocumento: null,
    numeroDocumento: null,
    activo: false,
  } as const;
}

/** Una cuenta anonimizada ya no se puede editar ni reactivar. */
export function estaAnonimizada(email: string): boolean {
  return email.endsWith("@anonimo.invalid");
}
