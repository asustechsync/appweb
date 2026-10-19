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
  compararTallas,
  opcionesDeCompra,
  type VarianteElegible,
  type ColorElegible,
  type OpcionDeTalla,
} from "./catalogo/variantes";

export { IMAGEN_DEMO, slugDesdeTexto, skuDeVariante, varianteRepetida } from "./catalogo/gestion";

export {
  ORDENES,
  ETIQUETAS_ORDEN,
  SIN_FILTROS,
  MIN_LETRAS_BUSQUEDA,
  filtrosDesdeUrl,
  urlDeFiltros,
  hayFiltros,
  terminosDeBusqueda,
  ordenarPorPrecio,
  type Orden,
  type FiltrosListado,
} from "./catalogo/filtros";

export {
  TIPOS_IMAGEN,
  MAX_BYTES_IMAGEN,
  MAX_IMAGENES_POR_PRODUCTO,
  revisarImagen,
  mensajeDeRechazoImagen,
  rutaDeImagen,
  esImagenDemo,
  urlDeFoto,
  type TipoImagen,
  type RechazoImagen,
} from "./catalogo/imagenes";

// Carrito
export {
  calcularTotales,
  redondear,
  type LineaCarrito,
  type MetodoEnvioCalculo,
  type TotalesCompra,
} from "./carrito/totales";

export {
  revisarCupon,
  normalizarCodigo,
  mensajeDeRechazoCupon,
  descuentoDeCupon,
  type Cupon,
  type ReglaCupon,
  type RechazoCupon,
} from "./carrito/cupones";

// Clientes
export { NIVELES, nivelPorCompras, type Nivel, type EstadoNivel } from "./clientes/niveles";

// Envios
export { cubreDepartamento, departamentosDesdeTexto } from "./envios/zonas";

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

export {
  planMovimientoManual,
  mensajeDeRechazoStock,
  TIPOS_MOVIMIENTO_MANUAL,
  ETIQUETAS_MOVIMIENTO,
  type TipoMovimientoManual,
  type RechazoStock,
  type EntradaMovimientoManual,
} from "./stock/manual";

// Pedidos
export {
  puedePasarA,
  siguientesEstados,
  esFinal,
  afectaStock,
  pasosDelPedido,
  ETIQUETAS,
  ESTADOS_PEDIDO,
  type EstadoPedido,
  type OpcionesEstado,
  type PasoPedido,
  type SituacionPaso,
} from "./pedidos/estados";

export {
  revisarConfirmacionPago,
  revisarCambioEstado,
  movimientosDelCambio,
  variantesSinStock,
  notaDeCambio,
  mensajeDeRechazoPedido,
  MEDIOS_PAGO,
  ETIQUETAS_MEDIO_PAGO,
  ESTADOS_PAGO,
  ETIQUETAS_PAGO,
  type MedioPagoPedido,
  type EstadoPago,
  type RechazoPedido,
  type EntradaCambioEstado,
  revisarDespacho,
  ESTADOS_DESPACHO,
} from "./pedidos/gestion";

export { generarCodigoPedido } from "./pedidos/codigo";

// WhatsApp
export {
  numeroWhatsApp,
  enlaceWhatsApp,
  mensajeConsultaWhatsApp,
  mensajeComprobanteWhatsApp,
  mensajeAlClienteWhatsApp,
} from "./contacto/whatsapp";

// Correos
export {
  correoRecuperacion,
  correoPedidoRecibido,
  correoPedidoNuevoTienda,
  correoReclamoRegistrado,
  correoReclamoNuevoTienda,
  correoReclamoRespondido,
  type TextoCorreo,
} from "./notificaciones/mensajes";

// Libro de Reclamaciones
export {
  TIPOS_RECLAMO,
  ETIQUETAS_TIPO_RECLAMO,
  DESCRIPCION_TIPO_RECLAMO,
  TIPOS_BIEN,
  ETIQUETAS_TIPO_BIEN,
  ESTADOS_RECLAMO,
  ETIQUETAS_ESTADO_RECLAMO,
  DIAS_HABILES_RESPUESTA,
  codigoReclamo,
  venceReclamo,
  diasParaVencer,
  revisarRespuesta,
  mensajeDeRechazoReclamo,
  type TipoReclamo,
  type TipoBien,
  type EstadoReclamo,
  type RechazoReclamo,
} from "./reclamos/libro";

// Seguridad
export { LimiteDeIntentos, mensajeDeEspera, type RevisionIntento } from "./seguridad/intentos";

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
  datosAnonimos,
  estaAnonimizada,
  type RechazoGestionUsuario,
} from "./usuarios/administracion";

export {
  crearTokenRecuperacion,
  usuarioDeTokenRecuperacion,
  verificarTokenRecuperacion,
  DURACION_RECUPERACION_MS,
} from "./usuarios/recuperacion";

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
