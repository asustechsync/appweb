/**
 * Textos de los correos. Viven aqui y no en cada pantalla: el checkout web,
 * el panel y la app movil mandan exactamente el mismo mensaje, y cambiar una
 * frase es cambiarla en un solo sitio.
 *
 * Texto plano a proposito: se lee igual en cualquier cliente de correo y no
 * hay plantilla HTML que mantener.
 */

const MONEDA = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export interface TextoCorreo {
  asunto: string;
  cuerpo: string;
}

export function correoRecuperacion(datos: { nombre: string; enlace: string }): TextoCorreo {
  return {
    asunto: "Recupera tu contraseña",
    cuerpo: [
      `Hola, ${datos.nombre}:`,
      "",
      "Pediste cambiar tu contraseña. Entra a este enlace para elegir una nueva (vale 1 hora y sirve una sola vez):",
      "",
      datos.enlace,
      "",
      "Si no fuiste tú, ignora este correo: tu contraseña sigue igual.",
    ].join("\n"),
  };
}

export function correoPedidoRecibido(datos: {
  nombre: string;
  codigo: string;
  total: number;
  medioPago: string;
  enlace: string;
}): TextoCorreo {
  return {
    asunto: `Recibimos tu pedido ${datos.codigo}`,
    cuerpo: [
      `Hola, ${datos.nombre}:`,
      "",
      `Recibimos tu pedido ${datos.codigo} por ${MONEDA.format(datos.total)}.`,
      `Medio de pago: ${datos.medioPago}.`,
      "",
      "Puedes ver cómo pagar y el estado de tu pedido aquí:",
      datos.enlace,
      "",
      "Te avisaremos cuando confirmemos tu pago.",
    ].join("\n"),
  };
}

export function correoPedidoNuevoTienda(datos: {
  codigo: string;
  total: number;
  cliente: string;
  medioPago: string;
  departamento: string;
  enlacePanel: string;
}): TextoCorreo {
  return {
    asunto: `Pedido nuevo ${datos.codigo} · ${MONEDA.format(datos.total)}`,
    cuerpo: [
      `Llegó el pedido ${datos.codigo}.`,
      "",
      `Cliente: ${datos.cliente}`,
      `Total: ${MONEDA.format(datos.total)} por ${datos.medioPago}`,
      `Envío a: ${datos.departamento}`,
      "",
      "Confírmalo en el panel cuando veas el pago:",
      datos.enlacePanel,
    ].join("\n"),
  };
}
