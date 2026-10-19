/**
 * Textos de los correos. Viven aqui y no en cada pantalla: el checkout web,
 * el panel y la app movil mandan exactamente el mismo mensaje, y cambiar una
 * frase es cambiarla en un solo sitio.
 *
 * Texto plano a proposito: se lee igual en cualquier cliente de correo y no
 * hay plantilla HTML que mantener.
 */

import { FECHA_LARGA, MONEDA } from "../formato";

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

/**
 * Constancia que la norma exige mandar al consumidor apenas registra su hoja:
 * es su copia del reclamo, con numero, fecha y el plazo de respuesta.
 */
export function correoReclamoRegistrado(datos: {
  nombre: string;
  codigo: string;
  tipo: string;
  creadoEn: Date;
  vence: Date;
  detalle: string;
  pedido: string;
  proveedor: string;
}): TextoCorreo {
  return {
    asunto: `Constancia de tu ${datos.tipo.toLowerCase()} N.° ${datos.codigo}`,
    cuerpo: [
      `Hola, ${datos.nombre}:`,
      "",
      `Registramos tu ${datos.tipo.toLowerCase()} en el Libro de Reclamaciones de ${datos.proveedor}.`,
      "",
      `Hoja N.°: ${datos.codigo}`,
      `Fecha: ${FECHA_LARGA.format(datos.creadoEn)}`,
      "",
      "Detalle:",
      datos.detalle,
      "",
      "Lo que pides:",
      datos.pedido,
      "",
      `Te responderemos a este correo a más tardar el ${FECHA_LARGA.format(datos.vence)} (15 días hábiles).`,
      "",
      "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
    ].join("\n"),
  };
}

export function correoReclamoNuevoTienda(datos: {
  codigo: string;
  tipo: string;
  nombre: string;
  vence: Date;
  enlacePanel: string;
}): TextoCorreo {
  return {
    asunto: `${datos.tipo} N.° ${datos.codigo} en el Libro de Reclamaciones`,
    cuerpo: [
      `${datos.nombre} registró un(a) ${datos.tipo.toLowerCase()}.`,
      "",
      `Hay que responder a más tardar el ${FECHA_LARGA.format(datos.vence)}. El plazo es legal y no se prorroga.`,
      "",
      "Respóndelo desde el panel:",
      datos.enlacePanel,
    ].join("\n"),
  };
}

export function correoReclamoRespondido(datos: {
  nombre: string;
  codigo: string;
  tipo: string;
  respuesta: string;
  proveedor: string;
}): TextoCorreo {
  return {
    asunto: `Respuesta a tu ${datos.tipo.toLowerCase()} N.° ${datos.codigo}`,
    cuerpo: [
      `Hola, ${datos.nombre}:`,
      "",
      `Esta es la respuesta de ${datos.proveedor} a tu ${datos.tipo.toLowerCase()} N.° ${datos.codigo}:`,
      "",
      datos.respuesta,
      "",
      "Si no estás conforme, puedes acudir al INDECOPI.",
    ].join("\n"),
  };
}
