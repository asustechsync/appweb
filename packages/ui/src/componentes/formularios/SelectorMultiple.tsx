import type { CSSProperties } from "react";

import "./selector-multiple.css";

export interface OpcionMultiple {
  valor: string;
  etiqueta: string;
  /** Muestra de color en hex ("#1E2A4A"): un circulo antes de la etiqueta. */
  muestra?: string | null;
}

export interface PropsSelectorMultiple {
  /** Titulo del grupo, visible encima de las pastillas. */
  etiqueta: string;
  opciones: OpcionMultiple[];
  /** Valores marcados, en cualquier orden. */
  valores: string[];
  onCambio: (valores: string[]) => void;
  disabled?: boolean;
}

/**
 * Marcar varias opciones a la vez con pastillas: tallas y colores de un lote
 * de variantes. Cada pastilla es un boton con `aria-pressed`; al cambiar se
 * devuelven los valores en el orden de `opciones`.
 */
export function SelectorMultiple({
  etiqueta,
  opciones,
  valores,
  onCambio,
  disabled,
}: PropsSelectorMultiple) {
  const marcados = new Set(valores);

  function alternar(valor: string) {
    const siguiente = new Set(marcados);
    if (siguiente.has(valor)) siguiente.delete(valor);
    else siguiente.add(valor);
    onCambio(opciones.map((o) => o.valor).filter((v) => siguiente.has(v)));
  }

  return (
    <fieldset className="ui-selector-multiple" disabled={disabled}>
      <legend className="ui-selector-multiple__titulo">{etiqueta}</legend>
      <div className="ui-selector-multiple__opciones">
        {opciones.map((opcion) => {
          const activa = marcados.has(opcion.valor);
          return (
            <button
              key={opcion.valor}
              type="button"
              aria-pressed={activa}
              className={
                activa
                  ? "ui-selector-multiple__opcion ui-selector-multiple__opcion--activa"
                  : "ui-selector-multiple__opcion"
              }
              onClick={() => alternar(opcion.valor)}
            >
              {opcion.muestra ? (
                <span
                  className="ui-selector-multiple__muestra"
                  style={{ "--muestra": opcion.muestra } as CSSProperties}
                  aria-hidden="true"
                />
              ) : null}
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
