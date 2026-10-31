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
 * `apartado` es el departamento (el titulo pequeño que separa el menu en
 * bloques) y `grupo` el modulo desplegable dentro de el. Cada modulo es el
 * trabajo de un mismo rol: quien vende no cobra, quien despacha no vende.
 * Los nombres de grupo y apartado son de una sola palabra.
 */
const SECCIONES_PANEL = [
  // El resumen del dia, suelto arriba.
  { id: "inicio", accion: "entrar_panel" },
  // Comercial: vender, conocer al cliente y atraerlo.
  { id: "pedidos", apartado: "Comercial", grupo: "Ventas", accion: "ver_ventas" },
  { id: "devoluciones", apartado: "Comercial", grupo: "Ventas", accion: "ver_ventas" },
  { id: "clientes", apartado: "Comercial", grupo: "Clientes", accion: "gestionar_usuarios" },
  { id: "niveles", apartado: "Comercial", grupo: "Clientes", accion: "gestionar_ajustes" },
  { id: "cupones", apartado: "Comercial", grupo: "Marketing", accion: "gestionar_ajustes" },
  { id: "portada", apartado: "Comercial", grupo: "Marketing", accion: "gestionar_ajustes" },
  // Operaciones: tener que vender, moverlo y responder por el. Categorias,
  // marcas y atributos van con los productos: son lo que se elige al crearlos.
  { id: "productos", apartado: "Operaciones", grupo: "Catálogo", accion: "gestionar_productos" },
  { id: "packs", apartado: "Operaciones", grupo: "Catálogo", accion: "gestionar_productos" },
  { id: "categorias", apartado: "Operaciones", grupo: "Catálogo", accion: "gestionar_productos" },
  { id: "marcas", apartado: "Operaciones", grupo: "Catálogo", accion: "gestionar_productos" },
  { id: "atributos", apartado: "Operaciones", grupo: "Catálogo", accion: "gestionar_productos" },
  { id: "inventario", apartado: "Operaciones", grupo: "Logística", accion: "ajustar_stock" },
  { id: "envios", apartado: "Operaciones", grupo: "Logística", accion: "despachar_envios" },
  {
    id: "proveedores",
    apartado: "Operaciones",
    grupo: "Logística",
    accion: "gestionar_productos",
  },
  { id: "reclamos", apartado: "Operaciones", grupo: "Soporte", accion: "atender_reclamos" },
  { id: "resenas", apartado: "Operaciones", grupo: "Soporte", accion: "moderar_resenas" },
  // Administracion: el dinero y lo que se configura una vez.
  { id: "pagos", apartado: "Administración", grupo: "Finanzas", accion: "ver_ventas" },
  // Sin pantalla aun: el panel muestra el estado vacio. Ver puertos/facturacion.ts.
  { id: "facturacion", apartado: "Administración", grupo: "Finanzas", accion: "ver_ventas" },
  { id: "tienda", apartado: "Administración", grupo: "Ajustes", accion: "gestionar_ajustes" },
  { id: "equipo", apartado: "Administración", grupo: "Ajustes", accion: "gestionar_usuarios" },
] as const satisfies readonly { id: string; apartado?: string; grupo?: string; accion: Accion }[];

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

/** Departamento del menu ("Comercial", "Operaciones"…) al que pertenece una seccion. */
export function apartadoDeSeccion(id: string): string | undefined {
  const seccion = SECCIONES_PANEL.find((candidata) => candidata.id === id);
  return seccion && "apartado" in seccion ? seccion.apartado : undefined;
}
