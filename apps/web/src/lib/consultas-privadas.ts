/**
 * Lecturas que dependen de quien esta sesionado.
 *
 * Separadas de consultas.ts a proposito: todo lo de ahi es "use cache" para
 * el catalogo publico. Esto es lo contrario — direcciones y pedidos de un
 * usuario concreto — y por eso nunca lleva `use cache`: cachear una direccion
 * por usuario multiplicaria las entradas de cache sin ningun beneficio, y
 * mostrarle a alguien la direccion de otro por una llave mal armada es
 * exactamente el tipo de error que esto evita de raiz.
 */

import { prisma } from "@appweb/db";

export interface DireccionDeUsuario {
  id: string;
  departamento: string;
  provincia: string;
  distrito: string;
  calle: string;
  referencia: string | null;
  principal: boolean;
}

export async function direccionesDelUsuario(usuarioId: string): Promise<DireccionDeUsuario[]> {
  return prisma.direccion.findMany({
    where: { usuarioId },
    orderBy: [{ principal: "desc" }],
    select: {
      id: true,
      departamento: true,
      provincia: true,
      distrito: true,
      calle: true,
      referencia: true,
      principal: true,
    },
  });
}

export interface PedidoDelUsuario {
  codigo: string;
  estado: string;
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  envioDepartamento: string;
  envioProvincia: string;
  envioDistrito: string;
  envioCalle: string;
  envioReferencia: string | null;
  envioMetodo: string;
  comprobante: string;
  documento: string;
  razonSocial: string | null;
  medioPago: string;
  creadoEn: Date;
  items: {
    nombreProducto: string;
    talla: string;
    color: string;
    precioUnitario: number;
    cantidad: number;
  }[];
}

/**
 * Un pedido por su codigo, pero SOLO si pertenece al usuario que pregunta.
 * `null` tanto si el codigo no existe como si es de otro cliente: las dos
 * cosas se ven igual desde afuera.
 */
export async function pedidoDelUsuario(
  usuarioId: string,
  codigo: string,
): Promise<PedidoDelUsuario | null> {
  const pedido = await prisma.pedido.findFirst({
    where: { codigo, usuarioId },
    include: { items: true },
  });

  if (pedido === null) return null;

  return {
    codigo: pedido.codigo,
    estado: pedido.estado,
    subtotal: Number(pedido.subtotal),
    descuento: Number(pedido.descuento),
    costoEnvio: Number(pedido.costoEnvio),
    total: Number(pedido.total),
    envioDepartamento: pedido.envioDepartamento,
    envioProvincia: pedido.envioProvincia,
    envioDistrito: pedido.envioDistrito,
    envioCalle: pedido.envioCalle,
    envioReferencia: pedido.envioReferencia,
    envioMetodo: pedido.envioMetodo,
    comprobante: pedido.comprobante,
    documento: pedido.documento,
    razonSocial: pedido.razonSocial,
    medioPago: pedido.medioPago,
    creadoEn: pedido.creadoEn,
    items: pedido.items.map((item) => ({
      nombreProducto: item.nombreProducto,
      talla: item.talla,
      color: item.color,
      precioUnitario: Number(item.precioUnitario),
      cantidad: item.cantidad,
    })),
  };
}
