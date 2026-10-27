"use client";

import type { EstadoPedido } from "@appweb/core";
import {
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  IconoCamion,
  IconoPack,
  IconoReloj,
  IconoTicket,
  IconoUbicacion,
  Insignia,
  LogoIcono,
  RejillaBento,
} from "@appweb/ui";

import { cuandoFue } from "@appweb/core/formato";

/** Un pedido de la cola de despacho, como lo trae `panel.envios.cola`. */
export interface EnvioDeCola {
  id: string;
  codigo: string;
  estado: EstadoPedido;
  cobrarAlEntregar: boolean;
  creadoEn: string;
  destinatario: string;
  telefono: string | null;
  direccion: string;
  distrito: string;
  departamento: string;
  referencia: string | null;
  metodo: string;
  transportista: string | null;
  codigoSeguimiento: string | null;
  items: { nombreProducto: string; sku: string; talla: string; color: string; cantidad: number }[];
  recorrido: { estado: EstadoPedido; usuario: string | null; creadoEn: string }[];
}

/** Como lee el almacen cada estado de la cola. */
export const ETAPA_ENVIO: Partial<Record<EstadoPedido, string>> = {
  PAGADO: "Por preparar",
  PREPARANDO: "Preparando",
  ENVIADO: "En camino",
  ENTREGADO: "Entregado",
};

/** Ambar lo que nadie empezo, verde lo que ya llego; el resto, neutro: todavia no llega. */
export function tonoDeEtapa(estado: EstadoPedido): "alerta" | "exito" | "neutro" {
  if (estado === "ENTREGADO") return "exito";
  return estado === "PAGADO" ? "alerta" : "neutro";
}

/** Cada paso del historial, contado como recorrido del paquete. */
const PASO_RECORRIDO: Partial<Record<EstadoPedido, string>> = {
  PAGADO: "Listo para preparar",
  PREPARANDO: "En preparación",
  ENVIADO: "Entregado al transportista",
  ENTREGADO: "Entregado al cliente",
};

export interface PropsCuadrosEnvio {
  pedido: EnvioDeCola;
  /** El siguiente paso del despacho, si lo hay: "Marcar enviado". */
  accion?: { etiqueta: string; onClick: () => void } | undefined;
}

/**
 * Vista previa de un envio: a donde va, con quien y por donde paso. Sin montos
 * (son de Pagos) y sin cancelar (es de Pedidos). El contenido va para que el
 * almacen arme el paquete, sin precios.
 */
export function CuadrosEnvio({ pedido: p, accion }: PropsCuadrosEnvio) {
  const unidades = p.items.reduce((suma, item) => suma + item.cantidad, 0);
  const recorrido = p.recorrido.filter((paso) => PASO_RECORRIDO[paso.estado]);

  return (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoIcono icono={<IconoCamion tamano={16} />} nombre="Envío" />}
        estado={{ texto: ETAPA_ENVIO[p.estado] ?? p.estado, tono: tonoDeEtapa(p.estado) }}
        etiqueta={p.transportista ?? p.metodo}
        monto={p.distrito || p.departamento}
        texto
        detalle={`${p.codigo} · ${cuandoFue(new Date(p.creadoEn))}`}
        acciones={accion ? [accion] : []}
      />
      <CuadroBento
        icono={<IconoTicket tamano={16} />}
        titulo="Guía de seguimiento"
        ancho="ancho"
        vacio={!p.codigoSeguimiento}
        {...(p.codigoSeguimiento ? { copiable: p.codigoSeguimiento } : {})}
      >
        {p.codigoSeguimiento ?? "Sin guía todavía"}
      </CuadroBento>
      <CuadroBento
        icono={<IconoUbicacion tamano={16} />}
        titulo="Destino"
        ancho="ancho"
        detalle={p.referencia ? `${p.direccion} · Ref.: ${p.referencia}` : p.direccion}
        {...(p.cobrarAlEntregar
          ? { marca: <Insignia tono="alerta">Cobrar al entregar</Insignia> }
          : {})}
        {...(p.telefono ? { cifras: [{ valor: p.telefono, etiqueta: "teléfono" }] } : {})}
      >
        {p.destinatario}
      </CuadroBento>
      <CuadroDesglose
        icono={<IconoPack tamano={16} />}
        titulo="Contenido"
        ancho="ancho"
        lineas={p.items.map((item) => ({
          etiqueta: `${item.nombreProducto} · ${item.talla} · ${item.color}`,
          valor: `× ${item.cantidad}`,
        }))}
        total={{ etiqueta: "Unidades", valor: String(unidades) }}
      />
      {recorrido.length > 0 ? (
        <CuadroDesglose
          icono={<IconoReloj tamano={16} />}
          titulo="Recorrido"
          ancho="ancho"
          lineas={recorrido.map((paso) => ({
            etiqueta: PASO_RECORRIDO[paso.estado] ?? paso.estado,
            valor: cuandoFue(new Date(paso.creadoEn)),
          }))}
        />
      ) : null}
    </RejillaBento>
  );
}
