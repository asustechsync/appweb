"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Alerta,
  Cargando,
  CuadroBento,
  CuadroDesglose,
  CuadroMonto,
  IconoCatalogo,
  IconoEtiqueta,
  LogoFoto,
  RejillaBento,
} from "@appweb/ui";

import { useTRPC } from "@/lib/trpc";
import { urlVisible } from "@/lib/url-visible";

import { MONEDA } from "@appweb/core/formato";

/** De las variantes solo las primeras: la vista previa no crece sin fin. */
const VARIANTES_VISIBLES = 6;

/** Lo que la fila ya trae: se pinta sin esperar al detalle. */
export interface ProductoDeLista {
  id: string;
  nombre: string;
  imagen: string | null;
  precio: number;
  precioLista: number | null;
  activo: boolean;
  destacado: boolean;
  categoria: string;
  marca: string | null;
  stockTotal: number;
}

/** Oculto manda: no se vende aunque tenga stock. Sin stock, en rojo. */
export function estadoDeProducto(p: { activo: boolean; stockTotal: number }): {
  texto: string;
  tono: "exito" | "alerta" | "error";
} {
  if (!p.activo) return { texto: "Oculto", tono: "alerta" };
  if (p.stockTotal === 0) return { texto: "Sin stock", tono: "error" };
  return { texto: "En la tienda", tono: "exito" };
}

export interface PropsCuadrosProducto {
  producto: ProductoDeLista;
  onEditar: () => void;
}

/**
 * Vista previa de un producto: precio, donde vive en el catalogo y cuanto
 * queda de cada talla y color. Editar se hace en su editor.
 */
export function CuadrosProducto({ producto, onEditar }: PropsCuadrosProducto) {
  const trpc = useTRPC();
  const detalle = useQuery(trpc.panel.productos.detalle.queryOptions({ productoId: producto.id }));

  const p = producto;
  const variantes = (detalle.data?.variantes ?? []).filter((v) => v.activo);

  return (
    <RejillaBento>
      <CuadroMonto
        logo={<LogoFoto src={urlVisible(p.imagen)} nombre={p.nombre} />}
        estado={estadoDeProducto(p)}
        etiqueta={p.nombre}
        monto={MONEDA.format(p.precio)}
        {...(p.precioLista !== null ? { detalle: `Antes ${MONEDA.format(p.precioLista)}` } : {})}
        acciones={[{ etiqueta: "Editar producto", onClick: onEditar }]}
      />
      <CuadroBento
        icono={<IconoCatalogo tamano={16} />}
        titulo="Categoría"
        ancho="ancho"
        detalle={p.marca ?? "Sin marca"}
      >
        {p.categoria}
      </CuadroBento>
      <CuadroBento
        icono={<IconoEtiqueta tamano={16} />}
        titulo="Vitrina"
        ancho="ancho"
        cifras={[
          { valor: p.destacado ? "Sí" : "No", etiqueta: "Destacado" },
          { valor: String(detalle.data?.imagenes.length ?? "—"), etiqueta: "Fotos" },
        ]}
      >
        {p.activo ? "Se ve en la tienda" : "No se ve en la tienda"}
      </CuadroBento>
      {detalle.isPending ? (
        <Cargando texto="Cargando tallas…" />
      ) : detalle.isError ? (
        <Alerta tono="error">{detalle.error.message}</Alerta>
      ) : (
        <CuadroDesglose
          icono={<IconoCatalogo tamano={16} />}
          titulo={variantes.length === 0 ? "Sin tallas a la venta" : "Tallas y colores"}
          ancho="ancho"
          lineas={variantes.slice(0, VARIANTES_VISIBLES).map((v) => ({
            etiqueta: `${v.talla} · ${v.color}`,
            valor: `${v.stock} u.`,
          }))}
          total={{
            etiqueta: "Unidades",
            valor: String(p.stockTotal),
            ...(variantes.length > VARIANTES_VISIBLES
              ? { nota: `y ${variantes.length - VARIANTES_VISIBLES} variantes más` }
              : {}),
          }}
        />
      )}
    </RejillaBento>
  );
}
