import { notFound, redirect } from "next/navigation";

import { pasosDelPedido, type EstadoPedido } from "@appweb/core";
import { prisma } from "@appweb/db";
import {
  BloqueDetalle,
  Boton,
  Contenedor,
  DisposicionConfirmacion,
  FilaDetalles,
  IconoMoneda,
  IconoPedidos,
  IconoTicket,
  IconoUbicacion,
  LineaEstados,
  TarjetaPedido,
} from "@appweb/ui";

import { pedidoDelUsuario } from "@/lib/consultas-privadas";
import { ETIQUETAS_MEDIO, medioPagoDesdeEnum, pasarela } from "@/lib/pago";
import { leerSesion } from "@/lib/sesion";

/**
 * Confirmacion del pedido. Hoja dinamica: lee la sesion para comprobar que el
 * pedido es de quien pregunta, no de otro cliente adivinando codigos.
 */
export const instant = false;

export const metadata = { title: "Pedido confirmado" };

interface Props {
  params: Promise<{ codigo: string }>;
}

const FECHA = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Lima",
});

const MONEDA = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export default async function PaginaPedido({ params }: Props) {
  const { codigo } = await params;
  const sesion = await leerSesion();

  if (!sesion) {
    redirect(`/ingresar?next=/pedido/${codigo}`);
  }

  const [pedido, usuario] = await Promise.all([
    pedidoDelUsuario(sesion.usuarioId, codigo),
    prisma.usuario.findUnique({ where: { id: sesion.usuarioId }, select: { email: true } }),
  ]);
  if (!pedido) notFound();

  // Las instrucciones de PagoManual no dependen de nada que cambie entre
  // visitas (mismo monto, mismo medio, mismos datos de la tienda): se
  // recalculan aqui en vez de guardarse, igual que el checkout las pidio.
  const medio = medioPagoDesdeEnum(pedido.medioPago);
  const resultado = await pasarela.cobrar({
    pedidoId: pedido.codigo,
    codigoPedido: pedido.codigo,
    monto: pedido.total,
    medio,
    emailCliente: usuario?.email ?? "",
  });
  const instrucciones =
    pedido.estado === "PENDIENTE_PAGO" && resultado.estado === "pendiente"
      ? resultado.instrucciones
      : null;

  const pasos = pasosDelPedido(pedido.estado as EstadoPedido);
  const cancelado = pasos.length === 0;
  const primerNombre = sesion.nombre.split(" ")[0] ?? sesion.nombre;
  const esFactura = pedido.comprobante === "FACTURA";

  return (
    <main>
      <Contenedor>
        <DisposicionConfirmacion
          titulo={cancelado ? "Pedido cancelado" : `¡Gracias, ${primerNombre}!`}
          texto={
            cancelado
              ? "Este pedido ya no está activo. Si tienes dudas, escríbenos."
              : "Recibimos tu pedido. Apenas confirmemos el pago lo preparamos; puedes seguirlo desde Mi cuenta."
          }
          codigo={pedido.codigo}
          fecha={FECHA.format(pedido.creadoEn)}
          lateral={
            <TarjetaPedido
              titulo="Resumen del pedido"
              items={pedido.items}
              subtotal={pedido.subtotal}
              descuento={pedido.descuento}
              costoEnvio={pedido.costoEnvio}
              total={pedido.total}
            />
          }
          acciones={
            <>
              <Boton href="/mi-cuenta/pedidos">Ver mis pedidos</Boton>
              <Boton variante="secundario" href="/">
                Seguir comprando
              </Boton>
            </>
          }
        >
          {!cancelado ? (
            <BloqueDetalle titulo="Seguimiento" icono={<IconoPedidos tamano={20} />}>
              <LineaEstados pasos={pasos} />
            </BloqueDetalle>
          ) : null}

          {instrucciones ? (
            <BloqueDetalle titulo="Cómo pagar" icono={<IconoMoneda tamano={20} />} destacado>
              <span>{ETIQUETAS_MEDIO[medio]?.etiqueta ?? "Pago"}</span>
              <span className="ui-bloque-detalle__monto">{MONEDA.format(pedido.total)}</span>
              <p>{instrucciones}</p>
            </BloqueDetalle>
          ) : null}

          <FilaDetalles>
            <BloqueDetalle titulo="Envío" icono={<IconoUbicacion tamano={20} />}>
              <strong>{pedido.envioCalle}</strong>
              <span>
                {pedido.envioDistrito}, {pedido.envioProvincia}, {pedido.envioDepartamento}
              </span>
              {pedido.envioReferencia ? <span>Ref.: {pedido.envioReferencia}</span> : null}
              <span>{pedido.envioMetodo}</span>
            </BloqueDetalle>

            <BloqueDetalle titulo="Comprobante" icono={<IconoTicket tamano={20} />}>
              <strong>{esFactura ? "Factura" : "Boleta"}</strong>
              <span>
                {esFactura ? "RUC" : "DNI"} {pedido.documento}
              </span>
              {pedido.razonSocial ? <span>{pedido.razonSocial}</span> : null}
              <span>Pago: {ETIQUETAS_MEDIO[medio]?.etiqueta ?? "—"}</span>
            </BloqueDetalle>
          </FilaDetalles>
        </DisposicionConfirmacion>
      </Contenedor>
    </main>
  );
}
