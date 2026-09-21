/**
 * Roles y que puede hacer cada uno.
 *
 * Se comprueba en packages/api, no en cada pantalla: un procedimiento
 * protegido cubre la web, el panel y el movil a la vez. Esconder un boton no
 * es seguridad.
 *
 * Son cuatro roles en un enum, no tres tablas de permisos. Si algun dia hacen
 * falta permisos a medida por usuario, entonces si toca la tabla.
 */

/** Los cuatro roles, en una sola lista: de aqui sale el tipo y tambien el
    esquema de validacion de tipos/, para que no se separen nunca. */
export const ROLES = ["CLIENTE", "VENDEDOR", "ALMACEN", "ADMIN"] as const;

export type Rol = (typeof ROLES)[number];

export type Accion =
  | "comprar"
  | "entrar_panel"
  | "ver_ventas"
  | "cambiar_estado_pedido"
  | "despachar_envios"
  | "ajustar_stock"
  | "gestionar_productos"
  | "gestionar_usuarios"
  | "gestionar_ajustes";

const PERMISOS: Record<Rol, readonly Accion[]> = {
  CLIENTE: ["comprar"],

  VENDEDOR: ["comprar", "entrar_panel", "ver_ventas", "cambiar_estado_pedido"],

  ALMACEN: ["comprar", "entrar_panel", "despachar_envios", "ajustar_stock"],

  ADMIN: [
    "comprar",
    "entrar_panel",
    "ver_ventas",
    "cambiar_estado_pedido",
    "despachar_envios",
    "ajustar_stock",
    "gestionar_productos",
    "gestionar_usuarios",
    "gestionar_ajustes",
  ],
};

export function puede(rol: Rol, accion: Accion): boolean {
  return PERMISOS[rol].includes(accion);
}

export function accionesDe(rol: Rol): readonly Accion[] {
  return PERMISOS[rol];
}

/** Secciones del panel que este rol debe ver en el menu. */
export function seccionesDelPanel(rol: Rol): string[] {
  const secciones: string[] = [];
  if (!puede(rol, "entrar_panel")) return secciones;

  secciones.push("resumen");
  if (puede(rol, "ver_ventas")) secciones.push("pedidos");
  if (puede(rol, "despachar_envios")) secciones.push("envios");
  if (puede(rol, "ajustar_stock")) secciones.push("stock");
  if (puede(rol, "gestionar_productos")) secciones.push("productos");
  if (puede(rol, "gestionar_usuarios")) secciones.push("usuarios");
  if (puede(rol, "gestionar_ajustes")) secciones.push("ajustes");

  return secciones;
}
