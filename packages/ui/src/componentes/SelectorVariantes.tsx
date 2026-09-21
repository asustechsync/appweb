"use client";

import { useState } from "react";

import "./primitivos.css";

/** Estructuralmente igual a `ColorElegible` de @appweb/core. */
export interface ColorDeCompra {
  color: string;
  varianteId: string;
}

/** Estructuralmente igual a `OpcionDeTalla` de @appweb/core, que es quien la
    calcula. Se declara aqui porque el paquete visual no depende de core: los
    primitivos reciben datos ya resueltos y no calculan nada. */
export interface OpcionDeCompra {
  talla: string;
  colores: ColorDeCompra[];
}

export interface PropsSelectorVariantes {
  opciones: OpcionDeCompra[];
  /** Ausente = todavia no hay a donde agregar (compatibilidad hacia atras). */
  onAgregar?: (varianteId: string) => void;
  agregando?: boolean;
}

/**
 * Isla cliente: elegir talla y color, y agregar esa variante al carrito. No
 * decide que combinaciones existen ni si hay stock — eso llega resuelto en
 * `opciones` desde `opcionesDeCompra` de @appweb/core, y quien guarda la
 * unidad en el carrito es quien pasa `onAgregar`.
 *
 * Al cambiar de talla se olvida el color elegido: el mismo color puede no
 * existir en la talla nueva, y dejarlo marcado mostraria una combinacion que
 * no se puede comprar.
 */
export function SelectorVariantes({ opciones, onAgregar, agregando }: PropsSelectorVariantes) {
  const primera = opciones[0];
  const [talla, setTalla] = useState<string | null>(primera?.talla ?? null);
  const [color, setColor] = useState<string | null>(
    primera?.colores.length === 1 ? (primera.colores[0]?.color ?? null) : null,
  );
  const [agregado, setAgregado] = useState(false);

  if (opciones.length === 0) return null;

  const coloresDeLaTalla = opciones.find((o) => o.talla === talla)?.colores ?? [];
  const varianteElegida = coloresDeLaTalla.find((c) => c.color === color) ?? null;
  const seleccionCompleta = varianteElegida !== null;

  function elegirTalla(nueva: string) {
    setTalla(nueva);
    const colores = opciones.find((o) => o.talla === nueva)?.colores ?? [];
    setColor(colores.length === 1 ? (colores[0]?.color ?? null) : null);
    setAgregado(false);
  }

  function elegirColor(nuevo: string) {
    setColor(nuevo);
    setAgregado(false);
  }

  function agregar() {
    if (!varianteElegida || !onAgregar) return;
    onAgregar(varianteElegida.varianteId);
    setAgregado(true);
  }

  return (
    <div className="ui-selector-variantes">
      <fieldset className="ui-selector-variantes__grupo">
        <legend className="ui-selector-variantes__titulo">Talla</legend>
        <div className="ui-selector-variantes__opciones">
          {opciones.map((opcion) => (
            <button
              key={opcion.talla}
              type="button"
              className={
                opcion.talla === talla
                  ? "ui-selector-variantes__opcion ui-selector-variantes__opcion--activa"
                  : "ui-selector-variantes__opcion"
              }
              onClick={() => elegirTalla(opcion.talla)}
              aria-pressed={opcion.talla === talla}
            >
              {opcion.talla}
            </button>
          ))}
        </div>
      </fieldset>

      {coloresDeLaTalla.length > 0 ? (
        <fieldset className="ui-selector-variantes__grupo">
          <legend className="ui-selector-variantes__titulo">Color</legend>
          <div className="ui-selector-variantes__opciones">
            {coloresDeLaTalla.map((opcionColor) => (
              <button
                key={opcionColor.color}
                type="button"
                className={
                  opcionColor.color === color
                    ? "ui-selector-variantes__opcion ui-selector-variantes__opcion--activa"
                    : "ui-selector-variantes__opcion"
                }
                onClick={() => elegirColor(opcionColor.color)}
                aria-pressed={opcionColor.color === color}
              >
                {opcionColor.color}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <button
        type="button"
        className="ui-selector-variantes__comprar"
        disabled={!seleccionCompleta || agregando}
        onClick={agregar}
      >
        {agregando ? "Agregando…" : agregado ? "Añadido ✓" : "Añadir al carrito"}
      </button>
      {!seleccionCompleta ? (
        <p className="ui-selector-variantes__aviso">Elige talla y color.</p>
      ) : null}
    </div>
  );
}
