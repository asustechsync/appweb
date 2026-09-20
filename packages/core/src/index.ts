// Reglas de negocio. Sin React y sin Prisma: la app movil importa de aqui
// exactamente igual que la web y el panel.

// Catalogo
export {
  resolverPrecio,
  resolverDisponibilidad,
  type PrecioProducto,
  type PrecioResuelto,
  type VarianteDisponible,
  type Disponibilidad,
} from "./catalogo/precios";

export {
  opcionesDeCompra,
  type VarianteElegible,
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
  ETIQUETAS,
  type EstadoPedido,
} from "./pedidos/estados";

// Usuarios
export {
  puede,
  accionesDe,
  seccionesDelPanel,
  type Rol,
  type Accion,
} from "./usuarios/permisos";
