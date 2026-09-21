"use server";

import { z } from "zod";

import { calcularTotales, generarCodigoPedido, hayStock, resolverPrecio } from "@appweb/core";
import { esquemaCheckout, esquemaDireccion, esquemaLineaCarrito } from "@appweb/core/tipos";
import { prisma } from "@appweb/db";

import { direccionesDelUsuario, type DireccionDeUsuario } from "@/lib/consultas-privadas";
import { pasarela } from "@/lib/pago";
import { leerSesion } from "@/lib/sesion";

const esquemaCrearPedido = esquemaCheckout.extend({
  lineas: z.array(esquemaLineaCarrito).min(1, "El carrito está vacío"),
});

const MEDIO_A_ENUM = {
  yape: "YAPE",
  plin: "PLIN",
  transferencia: "TRANSFERENCIA",
  contra_entrega: "CONTRA_ENTREGA",
} as const;

// ── Sesion y direcciones del comprador ──────────────────────────────────────

export interface SesionCheckout {
  sesion: { nombre: string } | null;
  direcciones: DireccionDeUsuario[];
}

export async function sesionYDireccionesCheckout(): Promise<SesionCheckout> {
  const sesion = await leerSesion();
  if (!sesion) return { sesion: null, direcciones: [] };

  const direcciones = await direccionesDelUsuario(sesion.usuarioId);
  return { sesion: { nombre: sesion.nombre }, direcciones };
}

// ── Nueva direccion ──────────────────────────────────────────────────────

export interface ResultadoDireccion {
  ok: boolean;
  error?: string;
  direccion?: DireccionDeUsuario;
}

export async function agregarDireccion(datos: unknown): Promise<ResultadoDireccion> {
  const sesion = await leerSesion();
  if (!sesion) return { ok: false, error: "Debes iniciar sesión." };

  const analizado = esquemaDireccion.safeParse(datos);
  if (!analizado.success) {
    return { ok: false, error: analizado.error.issues[0]?.message ?? "Revisa la dirección." };
  }

  const { referencia, ...resto } = analizado.data;
  const creada = await prisma.direccion.create({
    data: { ...resto, referencia: referencia ?? null, usuarioId: sesion.usuarioId },
  });

  return {
    ok: true,
    direccion: {
      id: creada.id,
      departamento: creada.departamento,
      provincia: creada.provincia,
      distrito: creada.distrito,
      calle: creada.calle,
      referencia: creada.referencia,
      principal: creada.principal,
    },
  };
}

// ── Cerrar el pedido ───────────────────────────────────────────────────────

export interface ResultadoPedido {
  ok: boolean;
  error?: string;
  codigo?: string;
}

/**
 * Cierra el pedido. Vuelve a leer precio y stock de la base — nunca confia en
 * lo que trae el navegador — y NO descuenta stock: eso pasa cuando alguien
 * confirma el pago desde el panel (ver `afectaStock` en @appweb/core).
 */
export async function crearPedido(datos: unknown): Promise<ResultadoPedido> {
  const sesion = await leerSesion();
  if (!sesion) return { ok: false, error: "Debes iniciar sesión." };

  const analizado = esquemaCrearPedido.safeParse(datos);
  if (!analizado.success) {
    return {
      ok: false,
      error: analizado.error.issues[0]?.message ?? "Revisa los datos del pedido.",
    };
  }

  const { direccionId, metodoEnvioId, medioPago, comprobante, documento, razonSocial, lineas } =
    analizado.data;

  const [usuario, direccion, metodoEnvio] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: sesion.usuarioId } }),
    prisma.direccion.findFirst({ where: { id: direccionId, usuarioId: sesion.usuarioId } }),
    prisma.metodoEnvio.findFirst({ where: { id: metodoEnvioId, activo: true } }),
  ]);

  if (!usuario) return { ok: false, error: "Sesión inválida." };
  if (!direccion) return { ok: false, error: "Elige una dirección válida." };
  if (!metodoEnvio) return { ok: false, error: "Elige un método de envío válido." };

  const ids = [...new Set(lineas.map((linea) => linea.varianteId))];
  const variantes = await prisma.variante.findMany({
    where: { id: { in: ids }, activa: true, producto: { activo: true } },
    include: { producto: { select: { nombre: true, precio: true, precioLista: true } } },
  });

  if (variantes.length !== ids.length) {
    return {
      ok: false,
      error: "Algún producto del carrito ya no está disponible. Vuelve al carrito.",
    };
  }

  const itemsPedido: {
    varianteId: string;
    nombreProducto: string;
    talla: string;
    color: string;
    precioUnitario: number;
    cantidad: number;
    stock: number;
  }[] = [];

  for (const linea of lineas) {
    const variante = variantes.find((v) => v.id === linea.varianteId);
    if (!variante) continue; // ya se comprobo arriba que todas las variantes existen

    if (!hayStock(variante.stock, linea.cantidad)) {
      return {
        ok: false,
        error: `${variante.producto.nombre} (${variante.talla}, ${variante.color}) ya no tiene stock suficiente. Vuelve al carrito.`,
      };
    }

    const precio = resolverPrecio({
      precio: Number(variante.producto.precio),
      precioLista:
        variante.producto.precioLista !== null ? Number(variante.producto.precioLista) : null,
    });

    itemsPedido.push({
      varianteId: variante.id,
      nombreProducto: variante.producto.nombre,
      talla: variante.talla,
      color: variante.color,
      precioUnitario: precio.precio,
      cantidad: linea.cantidad,
      stock: variante.stock,
    });
  }

  const totales = calcularTotales(itemsPedido, {
    metodoEnvio: {
      costo: Number(metodoEnvio.costo),
      gratisDesde: metodoEnvio.gratisDesde !== null ? Number(metodoEnvio.gratisDesde) : null,
    },
  });

  const codigo = generarCodigoPedido();

  const pedido = await prisma.pedido.create({
    data: {
      codigo,
      usuarioId: sesion.usuarioId,
      subtotal: totales.subtotal,
      descuento: totales.descuento,
      costoEnvio: totales.costoEnvio ?? 0,
      total: totales.total,
      envioDepartamento: direccion.departamento,
      envioProvincia: direccion.provincia,
      envioDistrito: direccion.distrito,
      envioCalle: direccion.calle,
      envioReferencia: direccion.referencia,
      envioMetodo: metodoEnvio.nombre,
      envioTelefono: usuario.telefono,
      comprobante: comprobante === "factura" ? "FACTURA" : "BOLETA",
      documento,
      razonSocial: razonSocial ?? null,
      medioPago: MEDIO_A_ENUM[medioPago],
      items: {
        create: itemsPedido.map((item) => ({
          varianteId: item.varianteId,
          nombreProducto: item.nombreProducto,
          talla: item.talla,
          color: item.color,
          precioUnitario: item.precioUnitario,
          cantidad: item.cantidad,
        })),
      },
    },
  });

  await pasarela.cobrar({
    pedidoId: pedido.id,
    codigoPedido: pedido.codigo,
    monto: totales.total,
    medio: medioPago,
    emailCliente: usuario.email,
  });

  return { ok: true, codigo: pedido.codigo };
}
