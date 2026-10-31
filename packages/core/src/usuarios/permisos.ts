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
  // General: el resumen del dia.
  { id: "inicio", apartado: "General", accion: "entrar_panel" },
  // Comercial: vender y atraer clientes.
  { id: "pedidos", apartado: "Comercial", grupo: "Ventas", accion: "ver_ventas" },
  { id: "pagos", apartado: "Comercial", grupo: "Ventas", accion: "ver_ventas" },
  { id: "envios", apartado: "Comercial", grupo: "Ventas", accion: "despachar_envios" },
  { id: "devoluciones", apartado: "Comercial", grupo: "Ventas", accion: "ver_ventas" },
  { id: "clientes", apartado: "Comercial", grupo: "Clientes", accion: "gestionar_usuarios" },
  { id: "niveles", apartado: "Comercial", grupo: "Clientes", accion: "gestionar_ajustes" },
  { id: "cupones", apartado: "Comercial", grupo: "Marketing", accion: "gestionar_ajustes" },
  { id: "portada", apartado: "Comercial", grupo: "Marketing", accion: "gestionar_ajustes" },
  // Operaciones: lo que hay que tener listo para vender. Categorias, marcas y
  // atributos van con los productos: son lo que se elige al crearlos.
  { id: "productos", apartado: "Operaciones", grupo: "Productos", accion: "gestionar_productos" },
  { id: "packs", apartado: "Operaciones", grupo: "Productos", accion: "gestionar_productos" },
  {
    id: "categorias",
    apartado: "Operaciones",
    grupo: "Productos",
    accion: "gestionar_productos",
  },
  { id: "marcas", apartado: "Operaciones", grupo: "Productos", accion: "gestionar_productos" },
  {
    id: "atributos",
    apartado: "Operaciones",
    grupo: "Productos",
    accion: "gestionar_productos",
  },
  { id: "inventario", apartado: "Operaciones", grupo: "Inventario", accion: "ajustar_stock" },
  {
    id: "proveedores",
    apartado: "Operaciones",
    grupo: "Inventario",
    accion: "gestionar_productos",
  },
  { id: "resenas", apartado: "Operaciones", grupo: "Atención", accion: "moderar_resenas" },
  { id: "reclamos", apartado: "Operaciones", grupo: "Atención", accion: "atender_reclamos" },
  // Configuracion: se ajusta una vez.
  { id: "tienda", apartado: "Configuración", grupo: "Ajustes", accion: "gestionar_ajustes" },
  { id: "equipo", apartado: "Configuración", grupo: "Ajustes", accion: "gestionar_usuarios" },
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

/** Apartado del menu ("Comercial", "Configuración") al que pertenece una seccion. */
export function apartadoDeSeccion(id: string): string | undefined {
  return SECCIONES_PANEL.find((candidata) => candidata.id === id)?.apartado;
}
