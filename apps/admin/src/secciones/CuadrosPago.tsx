"use client";

import { useQuery } from "@tanstack/react-query";

import {
  ETIQUETAS,
  ETIQUETAS_MEDIO_PAGO,
  ETIQUETAS_PAGO,
  enlaceCompartirWhatsApp,
  enlaceWhatsApp,
  mensajeAlClienteWhatsApp,
  mensajePagoRecibidoWhatsApp,
} from "@appweb/core";
import {
  Alerta,
  Cargando,
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  IconoFlechaBajada,
  IconoMoneda,
  IconoPedidos,
  IconoTicket,
  IconoUsuario,
  IconoVerificado,
  IconoWhatsAppLinea,
  InsigniaNivel,
  LogoBanco,
  LogoMedioPago,
  RejillaBento,
  TONO_NIVEL,
} from "@appweb/ui";
import type { BancoTransferencia } from "@appweb/ui";

import { ESTADO_PAGO, ETIQUETA_PAGO_RECIENTE } from "@/lib/estados-pago";
import { LOGO_MARCA, LOGO_MEDIO } from "@/lib/logos-pago";
import { useTRPC } from "@/lib/trpc";
import { FECHA, FECHA_HORA, MONEDA, cuandoFue } from "@appweb/core/formato";

const BANCOS_TRANSFERENCIA = new Set<BancoTransferencia>([
  "BCP",
  "INTERBANK",
  "BBVA",
  "SCOTIABANK",
  "BANCO_NACION",
  "OTRO",
]);

const ETIQUETAS_BANCO: Record<BancoTransferencia, string> = {
  BCP: "BCP",
  INTERBANK: "Interbank",
  BBVA: "BBVA",
  SCOTIABANK: "Scotiabank",
  BANCO_NACION: "Banco de la Nación",
  OTRO: "Otro banco",
};

/**
 * Los cuadros de un pago: monto, operacion, quien confirmo, pedido, cliente y
 * desglose. Los usa el detalle (a ancho completo) y la vista previa de la
 * lista (en la columna lateral, con `resumido`: solo monto, operacion y
 * desglose); ambos comparten la misma consulta.
 */
export function CuadrosPago({
  pagoId,
  resumido = false,
  principal,
}: {
  pagoId: string;
  resumido?: boolean;
  principal?: { etiqueta: string; onClick: () => void };
}) {
  const trpc = useTRPC();
  const detalle = useQuery(trpc.panel.pagos.detalle.queryOptions({ pagoId }));

  if (detalle.isPending) return <Cargando texto="Cargando el pago…" />;
  if (detalle.isError) return <Alerta tono="error">{detalle.error.message}</Alerta>;

  const pago = detalle.data;
  const medio = ETIQUETAS_MEDIO_PAGO[pago.medio];
  const logo = pago.tarjeta ? LOGO_MARCA[pago.tarjeta.marca] : LOGO_MEDIO[pago.medio];
  const codigoBanco = pago.pedido.bancoTransferencia;
  const banco =
    codigoBanco && BANCOS_TRANSFERENCIA.has(codigoBanco as BancoTransferencia)
      ? (codigoBanco as BancoTransferencia)
      : null;
  // Abre el chat con el mensaje escrito; quien lo envia es el que pulsa. Sin
  // un telefono valido WhatsApp abre igual y se elige el chat a mano.
  const mensajeWhatsApp =
    pago.estado === "CONFIRMADO"
      ? mensajePagoRecibidoWhatsApp({
          nombre: pago.pedido.cliente,
          codigo: pago.pedido.codigo,
          monto: pago.monto,
          medio,
        })
      : mensajeAlClienteWhatsApp({ nombre: pago.pedido.cliente, codigo: pago.pedido.codigo });
  const whatsapp =
    enlaceWhatsApp(pago.pedido.telefono, mensajeWhatsApp) ??
    enlaceCompartirWhatsApp(mensajeWhatsApp);

  const acciones = [
    // "Guardar como PDF" del navegador: imprime solo este detalle.
    {
      etiqueta: "Recibo PDF",
      icono: <IconoFlechaBajada tamano={16} />,
      onClick: () => window.print(),
    },
    {
      etiqueta: "WhatsApp",
      icono: <IconoWhatsAppLinea tamano={16} />,
      onClick: () => window.open(whatsapp, "_blank", "noopener"),
    },
  ];

  const cliente = (
    <CuadroBento
      icono={<IconoUsuario tamano={16} />}
      titulo="Cliente"
      ancho="ancho"
      detalle={pago.pedido.email}
      marca={
        <InsigniaNivel tono={TONO_NIVEL[pago.clienteResumen.nivelId]}>
          {pago.clienteResumen.nivel}
        </InsigniaNivel>
      }
      cifras={[
        {
          valor: String(pago.clienteResumen.pedidos),
          etiqueta: pago.clienteResumen.pedidos === 1 ? "pedido" : "pedidos",
        },
        { valor: MONEDA.format(pago.clienteResumen.totalComprado), etiqueta: "comprado" },
        {
          valor: FECHA.format(new Date(pago.clienteResumen.desde)),
          etiqueta: "cliente desde",
        },
      ]}
    >
      {pago.pedido.cliente}
    </CuadroBento>
  );

  return (
    <RejillaBento>
      <CuadroMonto
        logo={
          banco && pago.medio === "TRANSFERENCIA" ? (
            <LogoBanco banco={banco} />
          ) : (
            <LogoMedioPago medio={logo} nombre={medio} />
          )
        }
        estado={{
          texto: ETIQUETA_PAGO_RECIENTE[pago.estado] ?? ETIQUETAS_PAGO[pago.estado],
          tono: ESTADO_PAGO[pago.estado].tono,
          icono: ESTADO_PAGO[pago.estado].icono,
        }}
        etiqueta={
          banco && pago.medio === "TRANSFERENCIA"
            ? `${medio} · ${ETIQUETAS_BANCO[banco]}`
            : pago.tarjeta?.ultimos
              ? `${medio} •••• ${pago.tarjeta.ultimos}`
              : medio
        }
        monto={MONEDA.format(pago.monto)}
        detalle={FECHA_HORA.format(new Date(pago.creadoEn))}
        anulado={pago.estado === "RECHAZADO"}
        acciones={resumido ? (principal ? [principal] : []) : acciones}
      />
      <CuadroBento
        icono={<IconoTicket tamano={16} />}
        titulo="N.º de operación"
        ancho="ancho"
        vacio={!pago.referencia}
        {...(pago.referencia ? { copiable: pago.referencia } : {})}
      >
        {pago.referencia ?? "Sin número todavía"}
      </CuadroBento>
      {resumido ? cliente : null}
      {resumido ? null : (
        <>
          <CuadroBento
            icono={<IconoVerificado tamano={16} />}
            titulo={pago.estado === "RECHAZADO" ? "Rechazó" : "Confirmó"}
            vacio={!pago.confirmadoPor}
            {...(pago.confirmadoEn ? { detalle: cuandoFue(new Date(pago.confirmadoEn)) } : {})}
          >
            {pago.confirmadoPor ?? "Nadie aún"}
          </CuadroBento>
          <CuadroBento
            icono={<IconoPedidos tamano={16} />}
            titulo="Pedido"
            detalle={`${pago.pedido.articulos} ${
              pago.pedido.articulos === 1 ? "artículo" : "artículos"
            }`}
          >
            {ETIQUETAS[pago.pedido.estado]}
          </CuadroBento>
          {cliente}
        </>
      )}
      <CuadroDesglose
        icono={<IconoMoneda tamano={16} />}
        titulo="Desglose"
        ancho="ancho"
        lineas={[
          { etiqueta: "Productos", valor: MONEDA.format(pago.pedido.subtotal) },
          ...(pago.pedido.descuento > 0
            ? [
                {
                  etiqueta: pago.pedido.cuponCodigo
                    ? `Cupón ${pago.pedido.cuponCodigo}`
                    : "Descuento de nivel",
                  valor: `− ${MONEDA.format(pago.pedido.descuento)}`,
                  rebaja: true,
                },
              ]
            : []),
          {
            etiqueta: "Envío",
            valor: pago.pedido.costoEnvio > 0 ? MONEDA.format(pago.pedido.costoEnvio) : "Gratis",
          },
        ]}
        total={{
          etiqueta: "Total",
          nota: `IGV incl. ${MONEDA.format(pago.pedido.igv)}`,
          valor: MONEDA.format(pago.pedido.total),
        }}
      />
    </RejillaBento>
  );
}
