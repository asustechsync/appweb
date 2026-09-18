/**
 * PUERTO — Pasarela de pago.
 *
 * La interfaz se define AHORA, aunque la pasarela real llegue meses despues.
 * El checkout habla con esta interfaz y nunca con una pasarela concreta, asi
 * que el dia de la integracion se escribe una clase nueva y NO SE TOCA el
 * checkout.
 *
 * Hoy      -> PagoManual  (Yape, Plin, transferencia con comprobante)
 * Despues  -> PagoIzipay, PagoCulqi, lo que sea: misma interfaz.
 */

export type MedioPago = "yape" | "plin" | "transferencia" | "tarjeta" | "contra_entrega";

export interface SolicitudPago {
  pedidoId: string;
  codigoPedido: string;
  /** Monto en soles, con dos decimales. */
  monto: number;
  medio: MedioPago;
  emailCliente: string;
  /** A donde vuelve el cliente tras pagar, cuando la pasarela lo requiere. */
  urlRetorno?: string;
}

export type ResultadoPago =
  | {
      estado: "aprobado";
      referencia: string;
    }
  | {
      estado: "pendiente";
      referencia: string;
      /** URL de la pasarela, o instrucciones para el pago manual. */
      instrucciones: string;
    }
  | {
      estado: "rechazado";
      motivo: string;
    };

export interface PasarelaPago {
  /** Nombre visible del proveedor, para mostrarlo y para registrarlo. */
  readonly nombre: string;

  /** Medios que este proveedor puede cobrar. */
  readonly mediosSoportados: readonly MedioPago[];

  /** Inicia el cobro. No espera confirmacion: puede quedar pendiente. */
  cobrar(solicitud: SolicitudPago): Promise<ResultadoPago>;

  /**
   * Consulta el estado real de un cobro ya iniciado. El panel la usa para
   * confirmar un pago manual, y el webhook de la pasarela para verificar.
   */
  consultar(referencia: string): Promise<ResultadoPago>;
}
