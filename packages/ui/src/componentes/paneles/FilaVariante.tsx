import type { ReactNode } from "react";

import { IconoOjo, IconoOjoTachado, IconoPapelera } from "../../iconos";
import type { TonoMovimiento } from "./FilaMovimiento";

import "./fila-variante.css";

export interface PropsFilaVariante {
  /** Lo que va en el cuadrado: la talla ("L", "XL"). */
  talla: string;
  sku: string;
  /** Solo lo anormal (oculta, sin stock, stock bajo); lo normal no se marca. */
  estado: { texto: string; tono: TonoMovimiento } | null;
  stock: number;
  /** Campo del costo; vive en la app porque guarda contra el servidor. */
  costo: ReactNode;
  activo: boolean;
  deshabilitado?: boolean;
  onAlternarActivo: () => void;
  onEliminar: () => void;
}

/** Una variante en una sola linea: talla, SKU, stock, costo y acciones. */
export function FilaVariante({
  talla,
  sku,
  estado,
  stock,
  costo,
  activo,
  deshabilitado,
  onAlternarActivo,
  onEliminar,
}: PropsFilaVariante) {
  return (
    <div className="ui-fila-variante">
      <span className="ui-fila-variante__talla">{talla}</span>
      <span className="ui-fila-variante__sku">
        <span className="ui-fila-variante__codigo">{sku}</span>
        {estado ? (
          <span className={`ui-fila-variante__estado ui-fila-variante__estado--${estado.tono}`}>
            {estado.texto}
          </span>
        ) : null}
      </span>
      <span className="ui-fila-variante__stock">{stock}</span>
      <span className="ui-fila-variante__costo">{costo}</span>
      <span className="ui-fila-variante__iconos">
        <button
          type="button"
          className="ui-fila-variante__icono"
          aria-label={activo ? "Ocultar variante" : "Mostrar variante"}
          title={activo ? "Ocultar" : "Mostrar"}
          disabled={deshabilitado}
          onClick={onAlternarActivo}
        >
          {activo ? <IconoOjoTachado tamano={16} /> : <IconoOjo tamano={16} />}
        </button>
        <button
          type="button"
          className="ui-fila-variante__icono"
          aria-label="Eliminar variante"
          title="Eliminar"
          disabled={deshabilitado}
          onClick={onEliminar}
        >
          <IconoPapelera tamano={16} />
        </button>
      </span>
    </div>
  );
}

/** Las filas de variantes con sus etiquetas una sola vez arriba. */
export function RejillaVariantes({ children }: { children: ReactNode }) {
  return (
    <div className="ui-rejilla-variantes">
      <div className="ui-fila-variante ui-fila-variante--encabezado" aria-hidden="true">
        <span>Talla</span>
        <span>SKU</span>
        <span className="ui-fila-variante__stock">Stock</span>
        <span>Costo</span>
        <span />
      </div>
      {children}
    </div>
  );
}
