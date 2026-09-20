"use client";

import { useState } from "react";

import "./primitivos.css";

/** Estructuralmente igual a `OpcionDeTalla` de @appweb/core, que es quien la
    calcula. Se declara aqui porque el paquete visual no depende de core: los
    primitivos reciben datos ya resueltos y no calculan nada. */
export interface OpcionDeCompra {
  talla: string;
  colores: string[];
}

export interface PropsSelectorVariantes {
  opciones: OpcionDeCompra[];
}

/**
 * Isla cliente: elegir talla y color. No decide que combinaciones existen —
 * eso llega resuelto en `opciones` desde `opcionesDeCompra` de @appweb/core.
 *
 * Al cambiar de talla se olvida el color elegido: el mismo color puede no
 * existir en la talla nueva, y dejarlo marcado mostraria una combinacion que
 * no se puede comprar.
 */
export function SelectorVariantes({ opciones }: PropsSelectorVariantes) {
  const primera = opciones[0];
  const [talla, setTalla] = useState<string | null>(primera?.talla ?? null);
  const [color, setColor] = useState<string | null>(
    primera?.colores.length === 1 ? (primera.colores[0] ?? null) : null,
  );

  if (opciones.length === 0) return null;

  const coloresDeLaTalla = opciones.find((o) => o.talla === talla)?.colores ?? [];
  const seleccionCompleta = talla !== null && color !== null;

  function elegirTalla(nueva: string) {
    setTalla(nueva);
    const colores = opciones.find((o) => o.talla === nueva)?.colores ?? [];
    setColor(colores.length === 1 ? (colores[0] ?? null) : null);
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
            {coloresDeLaTalla.map((nombreColor) => (
              <button
                key={nombreColor}
                type="button"
                className={
                  nombreColor === color
                    ? "ui-selector-variantes__opcion ui-selector-variantes__opcion--activa"
                    : "ui-selector-variantes__opcion"
                }
                onClick={() => setColor(nombreColor)}
                aria-pressed={nombreColor === color}
              >
                {nombreColor}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {/* TEMPORAL: el carrito es Clase B y todavia es un stub
          (apps/web/src/app/(compra)/carrito/page.tsx). El boton queda
          deshabilitado a proposito en vez de fingir que agrega algo; cuando
          exista el carrito se conecta aqui su accion. */}
      <button type="button" className="ui-selector-variantes__comprar" disabled>
        Añadir al carrito
      </button>
      <p className="ui-selector-variantes__aviso">
        {seleccionCompleta
          ? "La compra en linea se activa en la siguiente fase."
          : "Elige talla y color."}
      </p>
    </div>
  );
}
