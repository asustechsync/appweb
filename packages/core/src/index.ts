// Reglas de negocio. Sin React y sin Prisma: la app movil importa de aqui
// exactamente igual que la web y el panel.

// Catalogo
export {
  resolverPrecio,
  resolverDisponibilidad,
  resolverNivelStock,
  type PrecioProducto,
  type PrecioResuelto,
  type VarianteDisponible,
  type Disponibilidad,
  type NivelStock,
} from "./catalogo/precios";

export {
  opcionesDeCompra,
  type VarianteElegible,
  type ColorElegible,
  type OpcionDeTalla,
} from "./catalogo/variantes";

// Carrito
export {
  calcularTotales,
  redondear,
  type LineaCarrito,
  type MetodoEnvioCalculo,
  type TotalesCompra,
} from "./carrito/totales";

export { buscarCupon, descuentoDeCupon, type Cupon } from "./carrito/cupones";

export {
  agregarAlCarrito,
  cambiarCantidad,
  quitarDelCarrito,
  quitarVariosDelCarrito,
  unidadesEn,
  normalizarCarrito,
  MAX_POR_LINEA,
  type LineaGuardada,
} from "./carrito/guardado";

// Stock
export {
  movimientosPorVenta,
  movimientosPorDevolucion,
  movimientoPorAjuste,
  saldoDe,
  hayStock,
  type MotivoStock,
  type MovimientoNuevo,
  type LineaVendida,
} from "./stock/movimientos";

// Pedidos
export {
  puedePasarA,
  siguientesEstados,
  esFinal,
  afectaStock,
  pasosDelPedido,
  ETIQUETAS,
  type EstadoPedido,
  type PasoPedido,
  type SituacionPaso,
} from "./pedidos/estados";

export { generarCodigoPedido } from "./pedidos/codigo";

// Panel
export {
  ESTADOS_VENTA,
  ESTADOS_PENDIENTES,
  UMBRAL_STOCK_BAJO,
  DIAS_VENTANA,
  inicioDeHace,
  variacion,
  diasDesde,
} from "./panel/resumen";

// Usuarios
export {
  puede,
  accionesDe,
  seccionesDelPanel,
  ROLES,
  type Rol,
  type Accion,
} from "./usuarios/permisos";

export {
  revisarCambioRol,
  revisarDesactivacion,
  mensajeDeRechazo,
  type RechazoGestionUsuario,
} from "./usuarios/administracion";

export { hashClave, verificarClave } from "./usuarios/credenciales";
export { nombreDesdeCorreo } from "./usuarios/nombre";
export { REQUISITOS_CLAVE, evaluarClave } from "./usuarios/requisitos-clave";

export {
  crearTokenSesion,
  verificarTokenSesion,
  type CargaSesion,
} from "./usuarios/sesion";

export {
  TIPOS_DOCUMENTO,
  ABREVIATURA_TIPO_DOCUMENTO,
  ETIQUETA_TIPO_DOCUMENTO,
  errorDocumentoComprobante,
  errorNumeroDocumento,
  AYUDA_NUMERO_DOCUMENTO,
  type TipoComprobante,
  type TipoDocumento,
} from "./usuarios/documento";

export { GENEROS, ETIQUETA_GENERO, type Genero } from "./usuarios/genero";
