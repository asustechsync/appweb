import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@appweb/db";
import { Alerta, PaginaInformativa, SeccionCheckout, TarjetaPedido } from "@appweb/ui";

import { pedidoDelUsuario } from "@/lib/consultas-privadas";
import { medioPagoDesdeEnum, pasarela } from "@/lib/pago";
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
  const resultado = await pasarela.cobrar({
    pedidoId: pedido.codigo,
    codigoPedido: pedido.codigo,
    monto: pedido.total,
    medio: medioPagoDesdeEnum(pedido.medioPago),
    emailCliente: usuario?.email ?? "",
  });
  const instrucciones = resultado.estado === "pendiente" ? resultado.instrucciones : null;

  return (
    <PaginaInformativa titulo={`Pedido ${pedido.codigo}`}>
      {instrucciones ? <Alerta tono="info">{instrucciones}</Alerta> : null}

      <TarjetaPedido
        items={pedido.items}
        subtotal={pedido.subtotal}
        descuento={pedido.descuento}
        costoEnvio={pedido.costoEnvio}
        total={pedido.total}
      />

      <SeccionCheckout numero={1} titulo="Envío">
        <p>{pedido.envioCalle}</p>
        <p>
          {pedido.envioDistrito}, {pedido.envioProvincia}, {pedido.envioDepartamento}
        </p>
        <p>{pedido.envioMetodo}</p>
      </SeccionCheckout>

      <Link className="ui-pagina-informativa__cta" href="/">
        Seguir comprando
      </Link>
    </PaginaInformativa>
  );
}
