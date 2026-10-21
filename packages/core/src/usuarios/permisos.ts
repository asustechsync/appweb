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
  | "atender_reclamos"
  | "moderar_resenas"
  | "despachar_envios"
  | "ajustar_stock"
  | "gestionar_productos"
  | "gestionar_usuarios"
  | "gestionar_ajustes";

const PERMISOS: Record<Rol, readonly Accion[]> = {
  CLIENTE: ["comprar"],

  VENDEDOR: [
    "comprar",
    "entrar_panel",
    "ver_ventas",
    "cambiar_estado_pedido",
    "atender_reclamos",
    "moderar_resenas",
  ],

  ALMACEN: ["comprar", "entrar_panel", "despachar_envios", "ajustar_stock"],

  ADMIN: [
    "comprar",
    "entrar_panel",
    "ver_ventas",
    "cambiar_estado_pedido",
    "atender_reclamos",
    "moderar_resenas",
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

/**
 * Menu del panel, en orden: de lo que se usa a diario a lo que se configura
 * una vez. Cada seccion la ve quien tenga su accion; las que tienen grupo
 * cuelgan de el, y las que no (el inicio) van sueltas arriba.
 *
 * `apartado` es el titulo pequeño que separa el menu en bloques: "Menú" para
 * lo que se usa a diario y "Preferencias" para lo que se configura.
 */
const SECCIONES_PANEL = [
  { id: "inicio", apartado: "Menú", accion: "entrar_panel" },
  { id: "pedidos", apartado: "Menú", grupo: "Ventas", accion: "ver_ventas" },
  { id: "envios", apartado: "Menú", grupo: "Ventas", accion: "despachar_envios" },
  { id: "productos", apartado: "Menú", grupo: "Catálogo", accion: "gestionar_productos" },
  { id: "inventario", apartado: "Menú", grupo: "Catálogo", accion: "ajustar_stock" },
  { id: "clientes", apartado: "Menú", grupo: "Cuentas", accion: "gestionar_usuarios" },
  { id: "equipo", apartado: "Menú", grupo: "Cuentas", accion: "gestionar_usuarios" },
  { id: "niveles", apartado: "Menú", grupo: "Cuentas", accion: "gestionar_ajustes" },
  { id: "resenas", apartado: "Menú", grupo: "Opiniones", accion: "moderar_resenas" },
  { id: "reclamos", apartado: "Menú", grupo: "Opiniones", accion: "atender_reclamos" },
  { id: "cupones", apartado: "Menú", grupo: "Promociones", accion: "gestionar_ajustes" },
  { id: "portada", apartado: "Menú", grupo: "Promociones", accion: "gestionar_ajustes" },
  { id: "tienda", apartado: "Preferencias", grupo: "Configuración", accion: "gestionar_ajustes" },
] as const satisfies readonly { id: string; apartado: string; grupo?: string; accion: Accion }[];

/** Secciones del panel que este rol debe ver en el menu, en orden. */
export function seccionesDelPanel(rol: Rol): string[] {
  if (!puede(rol, "entrar_panel")) return [];
  return SECCIONES_PANEL.filter((seccion) => puede(rol, seccion.accion)).map(
    (seccion) => seccion.id,
  );
}

/** Grupo del menu al que pertenece una seccion. */
export function grupoDeSeccion(id: string): string | undefined {
  const seccion = SECCIONES_PANEL.find((candidata) => candidata.id === id);
  return seccion && "grupo" in seccion ? seccion.grupo : undefined;
}

/** Apartado del menu ("Menú", "Preferencias") al que pertenece una seccion. */
export function apartadoDeSeccion(id: string): string | undefined {
  return SECCIONES_PANEL.find((candidata) => candidata.id === id)?.apartado;
}
