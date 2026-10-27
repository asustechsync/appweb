"use client";

import { useQuery } from "@tanstack/react-query";

import { ETIQUETAS_MOVIMIENTO } from "@appweb/core";
import {
  Alerta,
  Cargando,
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  IconoReloj,
  IconoTicket,
  LogoFoto,
  RejillaBento,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";
import { urlVisible } from "@/lib/url-visible";

import { conSigno, cuandoFue } from "@appweb/core/formato";

/** Del historial solo los ultimos movimientos: la vista previa no crece sin fin. */
const MOVIMIENTOS_VISIBLES = 5;

export interface VarianteDeStock {
  id: string;
  producto: string;
  imagen: string | null;
  talla: string;
  color: string;
  sku: string;
  stock: number;
  activa: boolean;
}

/** Agotada en rojo, por reponer en ambar; lo que no se vende, en gris. */
export function estadoDeStock(
  v: { stock: number; activa: boolean },
  umbral: number,
): { texto: string; tono: "exito" | "alerta" | "error" | "neutro" } {
  if (!v.activa) return { texto: "No está a la venta", tono: "neutro" };
  if (v.stock === 0) return { texto: "Agotada", tono: "error" };
  if (v.stock <= umbral) return { texto: "Por reponer", tono: "alerta" };
  return { texto: "Con stock", tono: "exito" };
}

export interface PropsCuadrosStock {
  variante: VarianteDeStock;
  umbral: number;
  /** Sin esto (en la propia pantalla de movimientos) no hay boton ni historial corto. */
  onMover?: () => void;
}

/** Vista previa de una variante: cuanto queda y sus ultimos movimientos. */
export function CuadrosStock({ variante, umbral, onMover }: PropsCuadrosStock) {
  const trpc = useTRPC();
  const historial = useQuery(trpc.panel.stock.historial.queryOptions({ varianteId: variante.id }));
  const v = variante;
  const conHistorial = onMover !== undefined;

  return (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoFoto src={urlVisible(v.imagen)} nombre={v.producto} />}
        estado={estadoDeStock(v, umbral)}
        etiqueta={`${v.producto} · ${v.talla} · ${v.color}`}
        monto={`${v.stock} u.`}
        texto
        detalle={`Se repone desde ${umbral} unidades`}
        {...(onMover ? { acciones: [{ etiqueta: "Mover stock", onClick: onMover }] } : {})}
      />
      <CuadroBento icono={<IconoTicket tamano={16} />} titulo="SKU" ancho="ancho" copiable={v.sku}>
        {v.sku}
      </CuadroBento>
      {!conHistorial ? null : historial.isPending ? (
        <Cargando texto="Cargando movimientos…" />
      ) : historial.isError ? (
        <Alerta tono="error">{historial.error.message}</Alerta>
      ) : (
        <CuadroDesglose
          icono={<IconoReloj tamano={16} />}
          titulo={historial.data.length === 0 ? "Sin movimientos" : "Últimos movimientos"}
          ancho="ancho"
          lineas={historial.data.slice(0, MOVIMIENTOS_VISIBLES).map((m) => ({
            etiqueta: `${ETIQUETAS_MOVIMIENTO[m.motivo]} · ${cuandoFue(new Date(m.creadoEn))}`,
            valor: conSigno(m.delta),
            ...(m.delta > 0 ? { rebaja: true } : {}),
          }))}
        />
      )}
    </RejillaBento>
  );
}
