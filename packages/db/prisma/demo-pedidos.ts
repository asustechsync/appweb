/**
 * Datos de demostracion: 16 pedidos de clientes al azar en dias pasados, con
 * los cuatro medios de pago (Yape, Plin, transferencia y tarjeta); 3 de ellos
 * se recogen en la tienda. Solo 4 quedan por confirmar (PENDIENTE_PAGO, pago
 * PENDIENTE); los otros 12 estan pagados y avanzan por PAGADO, PREPARANDO,
 * ENVIADO o ENTREGADO.
 *
 *     npm run demo-pedidos -w @appweb/db
 *
 * Reproduce lo que hace el checkout y el panel: precio, direccion y documento
 * congelados en el pedido; el stock sale por un movimiento VENTA al pagar (un
 * pedido pendiente no lo descuenta) y el cache `variante.stock` baja lo mismo.
 * Idempotente: si ya hay pedidos con la nota "Datos de demostracion", no hace
 * nada.
 *
 * Es solo para desarrollo.
 */

import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { EstadoPedido, MedioPago } from "@prisma/client";

import { calcularTotales, resolverPrecio, siguienteCodigoPedido } from "@appweb/core";
import { cadenaConexion } from "../src/conexion";

config({ path: "../../.env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: cadenaConexion() }),
});

const NOTA = "Datos de demostracion";
const DIA = 24 * 60 * 60 * 1000;

/** Generador repetible: la misma corrida da los mismos pedidos. */
function azar(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const al = azar(20261116);
const elegir = <T>(lista: readonly T[]): T => lista[Math.floor(al() * lista.length)] as T;

type Plan = {
  medio: MedioPago;
  estado: EstadoPedido;
  /** Hace cuantos dias se creo. */
  hace: number;
  /** Lo recoge en la tienda: sin transportista ni guia. */
  recojo?: boolean;
};

// 4 por confirmar (recientes) + 12 ya pagados repartidos en las ultimas semanas.
const PLAN: Plan[] = [
  { medio: "YAPE", estado: "PENDIENTE_PAGO", hace: 1 },
  { medio: "PLIN", estado: "PENDIENTE_PAGO", hace: 2 },
  { medio: "TRANSFERENCIA", estado: "PENDIENTE_PAGO", hace: 3 },
  { medio: "YAPE", estado: "PENDIENTE_PAGO", hace: 2, recojo: true },
  { medio: "YAPE", estado: "PAGADO", hace: 3 },
  { medio: "TARJETA", estado: "PAGADO", hace: 4 },
  { medio: "PLIN", estado: "PREPARANDO", hace: 5 },
  { medio: "TRANSFERENCIA", estado: "PREPARANDO", hace: 6 },
  { medio: "TRANSFERENCIA", estado: "PREPARANDO", hace: 7, recojo: true },
  { medio: "YAPE", estado: "ENVIADO", hace: 8 },
  { medio: "TARJETA", estado: "ENVIADO", hace: 10 },
  { medio: "TRANSFERENCIA", estado: "ENVIADO", hace: 12 },
  { medio: "PLIN", estado: "ENTREGADO", hace: 14 },
  { medio: "YAPE", estado: "ENTREGADO", hace: 17 },
  { medio: "PLIN", estado: "ENTREGADO", hace: 21, recojo: true },
  { medio: "TARJETA", estado: "ENTREGADO", hace: 25 },
];

const BANCOS = ["BCP", "INTERBANK", "BBVA", "SCOTIABANK", "BANCO_NACION"] as const;
const TRANSPORTISTAS = ["Olva Courier", "Shalom", "Cruz del Sur Cargo"] as const;
const TARJETAS = [
  { marca: "Visa", ultimos: "4242" },
  { marca: "Mastercard", ultimos: "5100" },
] as const;

const ORDEN: EstadoPedido[] = ["PENDIENTE_PAGO", "PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"];

const sumar = (fecha: Date, horas: number) => new Date(fecha.getTime() + horas * 60 * 60 * 1000);

async function main() {
  const yaHay = await prisma.historialPedido.count({ where: { nota: { contains: NOTA } } });
  if (yaHay > 0) {
    console.log("Ya hay pedidos de demostracion: no se crea nada.");
    return;
  }

  const admin = await prisma.usuario.findFirstOrThrow({
    where: { rol: "ADMIN" },
    select: { id: true },
  });

  // Clientes al azar con direccion y documento, sin repetir.
  const candidatos = await prisma.usuario.findMany({
    where: {
      rol: "CLIENTE",
      activo: true,
      numeroDocumento: { not: null },
      direcciones: { some: {} },
    },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      tipoDocumento: true,
      numeroDocumento: true,
      direcciones: { orderBy: { principal: "desc" }, take: 1 },
    },
  });
  const clientes = [...candidatos].sort(() => al() - 0.5).slice(0, PLAN.length);
  if (clientes.length < PLAN.length) throw new Error("Faltan clientes con direccion y documento.");

  const variantes = await prisma.variante.findMany({
    where: { activo: true, stock: { gte: 5 }, producto: { activo: true } },
    include: { producto: { select: { nombre: true, precio: true, precioLista: true } } },
  });
  if (variantes.length === 0) throw new Error("No hay variantes con stock.");

  const metodos = await prisma.metodoEnvio.findMany({ where: { activo: true } });
  const lima = metodos.find((m) => m.nombre === "Lima y Callao");
  const provincias = metodos.find((m) => m.nombre === "Provincias (agencia)");
  const recojo = metodos.find((m) => m.nombre === "Recojo en tienda");
  if (!lima || !provincias || !recojo) throw new Error("Faltan los metodos de envio.");

  // Correlativo por dia, igual que el checkout.
  const ultimoDelDia = new Map<string, string | null>();

  for (const [i, plan] of PLAN.entries()) {
    const cliente = clientes[i];
    const direccion = cliente?.direcciones[0];
    if (!cliente || !direccion || cliente.numeroDocumento === null) continue;

    const creado = new Date(Date.now() - plan.hace * DIA - Math.floor(al() * 10) * 60 * 60 * 1000);

    const elegidas = new Map<string, number>();
    const cuantas = 1 + Math.floor(al() * 3);
    while (elegidas.size < cuantas) elegidas.set(elegir(variantes).id, 1 + Math.floor(al() * 2));

    const items = [...elegidas].map(([varianteId, cantidad]) => {
      const v = variantes.find((x) => x.id === varianteId);
      if (!v) throw new Error("Variante perdida");
      const precio = resolverPrecio({
        precio: Number(v.producto.precio),
        precioLista: v.producto.precioLista !== null ? Number(v.producto.precioLista) : null,
      });
      return { v, cantidad, precioUnitario: precio.precio };
    });

    const metodo = plan.recojo
      ? recojo
      : direccion.departamento === "Lima" || direccion.departamento === "Callao"
        ? lima
        : provincias;
    const totales = calcularTotales(
      items.map((it) => ({
        varianteId: it.v.id,
        precioUnitario: it.precioUnitario,
        cantidad: it.cantidad,
        stock: it.v.stock,
      })),
      {
        metodoEnvio: {
          costo: Number(metodo.costo),
          gratisDesde: metodo.gratisDesde !== null ? Number(metodo.gratisDesde) : null,
        },
      },
    );

    const dia = `${creado.getFullYear()}-${creado.getMonth()}-${creado.getDate()}`;
    if (!ultimoDelDia.has(dia)) {
      const prefijo = siguienteCodigoPedido(creado, null).slice(0, -4);
      const ultimo = await prisma.pedido.findFirst({
        where: { codigo: { startsWith: prefijo } },
        orderBy: { codigo: "desc" },
        select: { codigo: true },
      });
      ultimoDelDia.set(dia, ultimo?.codigo ?? null);
    }
    const codigo = siguienteCodigoPedido(creado, ultimoDelDia.get(dia) ?? null);
    ultimoDelDia.set(dia, codigo);

    const pagado = plan.estado !== "PENDIENTE_PAGO";
    const pasos = ORDEN.slice(0, ORDEN.indexOf(plan.estado) + 1);

    const hitos = new Map<EstadoPedido, Date>();
    for (const [k, e] of pasos.entries()) hitos.set(e, sumar(creado, k === 0 ? 0 : 3 + k * 9));
    const enviadoEn = plan.recojo ? null : (hitos.get("ENVIADO") ?? null);
    const entregadoEn = hitos.get("ENTREGADO") ?? null;
    const confirmacion = hitos.get("PAGADO") ?? null;

    const tarjeta = plan.medio === "TARJETA" ? elegir(TARJETAS) : null;
    const operacion = String(10000000 + Math.floor(al() * 89999999));

    const pagoConfirmado = pagado;
    const fechaCobro = confirmacion;

    const pedido = await prisma.pedido.create({
      data: {
        codigo,
        usuarioId: cliente.id,
        estado: plan.estado,
        subtotal: totales.subtotal,
        descuento: totales.descuento,
        costoEnvio: totales.costoEnvio ?? 0,
        total: totales.total,
        medioPago: plan.medio,
        bancoTransferencia: plan.medio === "TRANSFERENCIA" ? elegir(BANCOS) : null,
        envioDestinatario: direccion.destinatario ?? cliente.nombre,
        envioTelefono: direccion.telefono ?? cliente.telefono,
        envioDepartamento: direccion.departamento,
        envioProvincia: direccion.provincia,
        envioDistrito: direccion.distrito,
        envioCalle: direccion.calle,
        envioReferencia: direccion.referencia,
        envioMetodo: metodo.nombre,
        transportista: enviadoEn ? elegir(TRANSPORTISTAS) : null,
        codigoSeguimiento: enviadoEn ? `DEMO${Math.floor(al() * 9000000 + 1000000)}` : null,
        enviadoEn,
        entregadoEn,
        comprobante: "BOLETA",
        documento: cliente.numeroDocumento,
        creadoEn: creado,
        items: {
          create: items.map((it) => ({
            varianteId: it.v.id,
            nombreProducto: it.v.producto.nombre,
            sku: it.v.sku,
            talla: it.v.talla,
            color: it.v.color,
            diseno: it.v.diseno,
            precioUnitario: it.precioUnitario,
            costoUnitario: it.v.costo,
            cantidad: it.cantidad,
          })),
        },
        pagos: {
          create: {
            medio: plan.medio,
            monto: totales.total,
            estado: pagoConfirmado ? "CONFIRMADO" : "PENDIENTE",
            // Todo pago trae su numero de operacion: el pendiente ya mando el comprobante.
            referencia: `DEMO-${operacion}`,
            tarjetaMarca: tarjeta?.marca ?? null,
            tarjetaUltimos: tarjeta?.ultimos ?? null,
            confirmadoPorId: pagoConfirmado && !tarjeta ? admin.id : null,
            confirmadoEn: pagoConfirmado ? fechaCobro : null,
            creadoEn: creado,
          },
        },
        historial: {
          create: pasos.map((estado, k) => ({
            estadoAnterior: k === 0 ? null : (pasos[k - 1] ?? null),
            estadoNuevo: estado,
            usuarioId: k === 0 ? null : admin.id,
            nota: k === 0 ? `Pedido creado en el checkout. ${NOTA}` : NOTA,
            creadoEn: hitos.get(estado) ?? creado,
          })),
        },
      },
    });

    // El stock baja al pagar, nunca antes:
    // movimiento VENTA + el mismo descuento en el cache de la variante.
    if (plan.estado !== "PENDIENTE_PAGO") {
      for (const it of items) {
        await prisma.movimientoStock.create({
          data: {
            varianteId: it.v.id,
            delta: -it.cantidad,
            motivo: "VENTA",
            pedidoId: pedido.id,
            nota: NOTA,
            creadoEn: confirmacion ?? creado,
          },
        });
        await prisma.variante.update({
          where: { id: it.v.id },
          data: { stock: { decrement: it.cantidad } },
        });
        it.v.stock -= it.cantidad;
      }
    }

    console.log(
      `  ✔ ${codigo}  ${plan.estado.padEnd(14)} ${plan.medio.padEnd(14)} S/ ${totales.total
        .toFixed(2)
        .padStart(7)}  ${cliente.nombre} (hace ${plan.hace} d)`,
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
