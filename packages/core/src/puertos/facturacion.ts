/**
 * PUERTO — Comprobante electronico (SUNAT / OSE).
 *
 * Sin implementar: al arrancar la boleta se emite fuera del sistema. La
 * interfaz existe desde hoy para que el checkout capture RUC/DNI y razon
 * social DESDE AHORA. Si esos datos no se piden desde el inicio, el dia que
 * toque emitir habra que perseguir a los clientes por datos que ya no estan.
 */

export type TipoComprobante = "boleta" | "factura";

export interface SolicitudComprobante {
  pedidoId: string;
  tipo: TipoComprobante;
  /** DNI para boleta, RUC para factura. */
  documento: string;
  razonSocial: string;
  direccionFiscal?: string;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  total: number;
}

export type ResultadoComprobante =
  | { estado: "emitido"; serie: string; numero: number; urlPdf?: string }
  | { estado: "rechazado"; motivo: string };

export interface Facturacion {
  readonly nombre: string;
  emitir(solicitud: SolicitudComprobante): Promise<ResultadoComprobante>;
  anular(serie: string, numero: number, motivo: string): Promise<ResultadoComprobante>;
}
