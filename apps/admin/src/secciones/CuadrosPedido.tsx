"use client";

import { useQuery } from "@tanstack/react-query";

import { ETIQUETAS } from "@appweb/core";
import {
  Alerta,
  Cargando,
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  IconoPedidos,
  IconoReloj,
  IconoUsuario,
  LogoIcono,
  RejillaBento,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";

import { tonoDeEstado } from "./Pedidos";
import { FECHA_HORA, cuandoFue } from "@appweb/core/formato";

/** Del historial solo los ultimos pasos: la vista previa no crece sin fin. */
const PASOS_VISIBLES = 4;

export interface PropsCuadrosPedido {
  pedidoId: string;
  /** El boton del cuadro principal: "Abrir pedido". */
  principal: { etiqueta: string; onClick: () => void };
}

/**
 * Vista previa de un pedido: la orden y en que va. Que se compro, para quien
 * y quien lo movio. Sin montos ni pagos: eso es de Pagos; sin transporte: eso
 * es de Envios.
 */
export function CuadrosPedido({ pedidoId, principal }: PropsCuadrosPedido) {
  const trpc = useTRPC();
  const detalle = useQuery(trpc.panel.pedidos.detalle.queryOptions({ pedidoId }));

  if (detalle.isPending) return <Cargando texto="Cargando el pedido…" />;
  if (detalle.isError) return <Alerta tono="error">{detalle.error.message}</Alerta>;

  const p = detalle.data;
  const unidades = p.items.reduce((suma, item) => suma + item.cantidad, 0);
  // Antes de pagar el stock aun no se descuenta: se avisa si ya no alcanza.
  const faltaStock =
    p.estado === "PENDIENTE_PAGO" && p.items.some((item) => item.stockActual < item.cantidad);
  const pasos = p.historial.slice(-PASOS_VISIBLES);

  return (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoIcono icono={<IconoPedidos tamano={16} />} nombre="Pedido" />}
        estado={{ texto: ETIQUETAS[p.estado], tono: tonoDeEstado(p.estado) }}
        etiqueta="Pedido"
        monto={p.codigo}
        texto
        detalle={FECHA_HORA.format(new Date(p.creadoEn))}
        acciones={[principal]}
      />
      <CuadroDesglose
        icono={<IconoPedidos tamano={16} />}
        titulo={faltaStock ? "Productos · falta stock" : "Productos"}
        ancho="ancho"
        lineas={p.items.map((item) => ({
          etiqueta: `${item.nombreProducto} · ${item.talla} · ${item.color}`,
          valor: `× ${item.cantidad}`,
        }))}
        total={{ etiqueta: "Unidades", valor: String(unidades) }}
      />
      <CuadroBento
        icono={<IconoUsuario tamano={16} />}
        titulo="Cliente"
        ancho="ancho"
        detalle={p.cliente.email}
        cifras={[
          {
            valor: p.comprobante.tipo === "FACTURA" ? "Factura" : "Boleta",
            etiqueta: p.comprobante.documento,
          },
        ]}
      >
        {p.cliente.nombre}
      </CuadroBento>
      <CuadroDesglose
        icono={<IconoReloj tamano={16} />}
        titulo="Historial"
        ancho="ancho"
        lineas={pasos.map((h) => ({
          etiqueta: h.usuario
            ? `${ETIQUETAS[h.estadoNuevo]} · ${h.usuario}`
            : ETIQUETAS[h.estadoNuevo],
          valor: cuandoFue(new Date(h.creadoEn)),
        }))}
      />
    </RejillaBento>
  );
}
