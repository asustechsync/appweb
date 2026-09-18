/**
 * PUERTOS — interfaces de lo que llega despues.
 *
 * Cada una se define hoy y se implementa cuando toque. Lo que las usa habla
 * con la interfaz, nunca con el proveedor concreto, asi que integrar el
 * proveedor real no obliga a tocar ninguna pantalla.
 */

export type {
  PasarelaPago,
  SolicitudPago,
  ResultadoPago,
  MedioPago,
} from "./pasarela-pago";
export { PagoManual } from "./pago-manual";

export type { Facturacion, SolicitudComprobante, ResultadoComprobante } from "./facturacion";
export type { Notificaciones, Mensaje } from "./notificaciones";
