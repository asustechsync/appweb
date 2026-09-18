import type {
  MedioPago,
  PasarelaPago,
  ResultadoPago,
  SolicitudPago,
} from "./pasarela-pago";

/**
 * Implementacion de arranque: el cliente paga por Yape, Plin o transferencia y
 * sube su comprobante; alguien lo confirma desde el panel.
 *
 * No habla con ningun servicio externo. El dia que entre la pasarela real,
 * esta clase se queda (sigue siendo util para pagos contra entrega) y el
 * checkout solo cambia cual instancia recibe.
 */
export class PagoManual implements PasarelaPago {
  readonly nombre = "Pago manual";

  readonly mediosSoportados: readonly MedioPago[] = [
    "yape",
    "plin",
    "transferencia",
    "contra_entrega",
  ];

  constructor(
    private readonly datos: {
      numeroYape?: string;
      numeroPlin?: string;
      cuentaBancaria?: string;
      titular?: string;
    } = {},
  ) {}

  async cobrar(solicitud: SolicitudPago): Promise<ResultadoPago> {
    if (!this.mediosSoportados.includes(solicitud.medio)) {
      return { estado: "rechazado", motivo: `Medio no disponible: ${solicitud.medio}` };
    }

    // Queda pendiente siempre: el dinero no se mueve aqui, se confirma a mano.
    return {
      estado: "pendiente",
      referencia: solicitud.codigoPedido,
      instrucciones: this.instrucciones(solicitud),
    };
  }

  async consultar(referencia: string): Promise<ResultadoPago> {
    // Sin servicio externo que consultar: quien confirma es el panel, que
    // escribe el estado del pedido directamente.
    return {
      estado: "pendiente",
      referencia,
      instrucciones: "Pendiente de confirmacion en el panel.",
    };
  }

  private instrucciones(solicitud: SolicitudPago): string {
    const monto = solicitud.monto.toFixed(2);
    const titular = this.datos.titular ?? "la tienda";

    switch (solicitud.medio) {
      case "yape":
        return `Yapea S/ ${monto} al ${this.datos.numeroYape ?? "numero de la tienda"} (${titular}) y sube tu captura.`;
      case "plin":
        return `Envia S/ ${monto} por Plin al ${this.datos.numeroPlin ?? "numero de la tienda"} (${titular}) y sube tu captura.`;
      case "transferencia":
        return `Transfiere S/ ${monto} a ${this.datos.cuentaBancaria ?? "la cuenta de la tienda"} (${titular}) y sube tu constancia.`;
      case "contra_entrega":
        return `Pagaras S/ ${monto} al recibir tu pedido.`;
      default:
        return `Monto a pagar: S/ ${monto}.`;
    }
  }
}
