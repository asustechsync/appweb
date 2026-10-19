"use server";

import { after } from "next/server";
import { z } from "zod";

import {
  calcularTotales,
  correoPedidoNuevoTienda,
  correoPedidoRecibido,
  cubreDepartamento,
  ETIQUETAS_MEDIO_PAGO,
  errorDocumentoComprobante,
  generarCodigoPedido,
  hayStock,
  mensajeDeRechazoCupon,
  resolverPrecio,
  revisarCupon,
  type Cupon,
} from "@appweb/core";
import { esquemaCheckout, esquemaDireccion, esquemaLineaCarrito } from "@appweb/core/tipos";
import { nivelDeUsuario } from "@appweb/api";
import { enviarCorreo } from "@appweb/api/correo";
import { entorno } from "@appweb/api/entorno";
import { URL_PANEL, URL_TIENDA } from "@appweb/api/urls";
import { prisma } from "@appweb/db";

import { buscarReglaCupon } from "@/lib/cupones";
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

export interface ContactoCheckout {
  nombre: string;
  email: string;
  telefono: string | null;
}

/** El nivel del cliente, para mostrar su descuento antes de confirmar. */
export interface NivelCheckout {
  nombre: string;
  descuentoPct: number;
}

export interface SesionCheckout {
  sesion: ContactoCheckout | null;
  direcciones: DireccionDeUsuario[];
  nivel: NivelCheckout | null;
}

export async function sesionYDireccionesCheckout(): Promise<SesionCheckout> {
  const sesion = await leerSesion();
  if (!sesion) return { sesion: null, direcciones: [], nivel: null };

  const [usuario, direcciones, estadoNivel] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: sesion.usuarioId },
      select: { email: true, telefono: true },
    }),
    direccionesDelUsuario(sesion.usuarioId),
    nivelDeUsuario(prisma, sesion.usuarioId),
  ]);
  if (!usuario) return { sesion: null, direcciones: [], nivel: null };

  return {
    sesion: { nombre: sesion.nombre, email: usuario.email, telefono: usuario.telefono },
    direcciones,
    nivel: {
      nombre: estadoNivel.nivel.nombre,
      descuentoPct: estadoNivel.nivel.descuentoPct,
    },
  };
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

  const {
    direccionId,
    metodoEnvioId,
    medioPago,
    comprobante,
    documento,
    razonSocial,
    lineas,
    cupon,
  } = analizado.data;

  const errorDocumento = errorDocumentoComprobante(comprobante, documento);
  if (errorDocumento) return { ok: false, error: errorDocumento };
  if (comprobante === "factura" && !razonSocial) {
    return { ok: false, error: "Escribe la razón social para la factura." };
  }

  const [usuario, direccion, metodoEnvio] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: sesion.usuarioId } }),
    prisma.direccion.findFirst({ where: { id: direccionId, usuarioId: sesion.usuarioId } }),
    prisma.metodoEnvio.findFirst({ where: { id: metodoEnvioId, activo: true } }),
  ]);

  if (!usuario) return { ok: false, error: "Sesión inválida." };
  if (!direccion) return { ok: false, error: "Elige una dirección válida." };
  if (!metodoEnvio) return { ok: false, error: "Elige un método de envío válido." };
  if (!cubreDepartamento(metodoEnvio.departamentos, direccion.departamento)) {
    return {
      ok: false,
      error: `${metodoEnvio.nombre} no llega a ${direccion.departamento}. Elige otro método de envío.`,
    };
  }

  const ids = [...new Set(lineas.map((linea) => linea.varianteId))];
  const variantes = await prisma.variante.findMany({
    where: { id: { in: ids }, activo: true, producto: { activo: true } },
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
    sku: string;
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
      sku: variante.sku,
      talla: variante.talla,
      color: variante.color,
      precioUnitario: precio.precio,
      cantidad: linea.cantidad,
      stock: variante.stock,
    });
  }

  // El descuento se recalcula aqui: el navegador solo manda el codigo.
  const subtotalBase = calcularTotales(itemsPedido).subtotal;
  const regla = cupon ? await buscarReglaCupon(cupon) : null;
  let cuponValido: Cupon | null = null;
  if (cupon) {
    const revision = revisarCupon(regla, { subtotal: subtotalBase });
    if ("rechazo" in revision) {
      return {
        ok: false,
        error: `${mensajeDeRechazoCupon(revision.rechazo, regla)} Quítalo para continuar.`,
      };
    }
    cuponValido = revision.cupon;
  }

  // El nivel se lee de los pedidos del cliente; cupon y nivel no se suman.
  const { nivel } = await nivelDeUsuario(prisma, sesion.usuarioId);

  const totales = calcularTotales(itemsPedido, {
    cupon: cuponValido,
    descuentoNivelPct: nivel.descuentoPct,
    metodoEnvio: {
      costo: Number(metodoEnvio.costo),
      gratisDesde: metodoEnvio.gratisDesde !== null ? Number(metodoEnvio.gratisDesde) : null,
    },
  });

  const codigo = generarCodigoPedido();
  // El cupon se consume solo si fue el que descontó (si ganó el nivel, queda libre).
  const reglaUsada = totales.origenDescuento === "cupon" ? regla : null;
  const notaCreacion =
    totales.origenDescuento === "nivel"
      ? `Pedido creado en el checkout. Descuento de nivel ${nivel.nombre} (${nivel.descuentoPct}%)`
      : "Pedido creado en el checkout";

  const pedido = await prisma.$transaction(async (tx) => {
    if (reglaUsada) {
      // Un uso mas, solo si queda alguno: dos compras a la vez no pasan del tope.
      const sumado = await tx.$executeRaw`
        UPDATE "cupones" SET "usos" = "usos" + 1, "editadoEn" = now()
        WHERE "id" = ${reglaUsada.id}
          AND ("usosMaximos" IS NULL OR "usos" < "usosMaximos")`;
      if (sumado === 0) return null;
    }
    return tx.pedido.create({
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
        envioDestinatario: direccion.destinatario ?? usuario.nombre,
        envioTelefono: direccion.telefono ?? usuario.telefono,
        cuponCodigo: reglaUsada?.codigo ?? null,
        comprobante: comprobante === "factura" ? "FACTURA" : "BOLETA",
        documento,
        razonSocial: razonSocial ?? null,
        medioPago: MEDIO_A_ENUM[medioPago],
        items: {
          create: itemsPedido.map((item) => ({
            varianteId: item.varianteId,
            nombreProducto: item.nombreProducto,
            sku: item.sku,
            talla: item.talla,
            color: item.color,
            precioUnitario: item.precioUnitario,
            cantidad: item.cantidad,
          })),
        },
        // El pago nace pendiente; el panel lo confirma con su referencia.
        pagos: {
          create: { medio: MEDIO_A_ENUM[medioPago], monto: totales.total },
        },
        historial: {
          create: { estadoNuevo: "PENDIENTE_PAGO", nota: notaCreacion },
        },
      },
    });
  });
  if (pedido === null) {
    return { ok: false, error: `${mensajeDeRechazoCupon("agotado")} Quítalo para continuar.` };
  }

  await pasarela.cobrar({
    pedidoId: pedido.id,
    codigoPedido: pedido.codigo,
    monto: totales.total,
    medio: medioPago,
    emailCliente: usuario.email,
  });

  // Los correos salen despues de responder: el cliente no espera a Resend, y
  // si el correo falla el pedido ya quedo creado igual.
  const medio = ETIQUETAS_MEDIO_PAGO[MEDIO_A_ENUM[medioPago]];
  after(async () => {
    const alCliente = correoPedidoRecibido({
      nombre: usuario.nombre,
      codigo: pedido.codigo,
      total: totales.total,
      medioPago: medio,
      enlace: `${URL_TIENDA}/pedido/${pedido.codigo}`,
    });
    await enviarCorreo(usuario.email, alCliente.asunto, alCliente.cuerpo);

    const tienda = entorno().avisosPedidos;
    if (tienda) {
      const aviso = correoPedidoNuevoTienda({
        codigo: pedido.codigo,
        total: totales.total,
        cliente: usuario.nombre,
        medioPago: medio,
        departamento: direccion.departamento,
        enlacePanel: `${URL_PANEL}/pedidos`,
      });
      await enviarCorreo(tienda, aviso.asunto, aviso.cuerpo);
    }
  });

  return { ok: true, codigo: pedido.codigo };
}
