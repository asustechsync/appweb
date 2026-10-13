"use client";

import { useState } from "react";

import { SelectorCantidad } from "./SelectorCantidad";

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

/** Nombres de color (sin tildes, en minuscula) que tienen muestra en tokens.ts. */
const MUESTRAS = new Set([
  "negro", "blanco", "gris", "plomo", "azul", "celeste", "rojo", "vino",
  "verde", "beige", "crema", "marron", "rosa", "amarillo", "naranja", "morado",
]);
const SINONIMOS: Record<string, string> = { cafe: "marron", lila: "morado", burdeos: "vino", turquesa: "celeste" };

/** Token de muestra para un color de variante, o null si no hay (se pinta como texto). */
function muestraDe(color: string): string | null {
  const palabras = color
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/\s+/);
  for (const palabra of palabras) {
    const nombre = SINONIMOS[palabra] ?? palabra;
    if (MUESTRAS.has(nombre)) return `var(--color-muestra-${nombre})`;
  }
  return null;
}

export interface PropsSelectorVariantes {
  opciones: OpcionDeCompra[];
  /** Ausente = todavia no hay a donde agregar (compatibilidad hacia atras). */
  onAgregar?: (varianteId: string, cantidad: number) => void;
  agregando?: boolean;
  /** Tope de unidades por compra; llega resuelto de fuera (stock). */
  maximo?: number;
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
export function SelectorVariantes({
  opciones,
  onAgregar,
  agregando,
  maximo = 10,
}: PropsSelectorVariantes) {
  const primera = opciones[0];
  const [talla, setTalla] = useState<string | null>(primera?.talla ?? null);
  const [color, setColor] = useState<string | null>(
    primera?.colores.length === 1 ? (primera.colores[0]?.color ?? null) : null,
  );
  const [agregado, setAgregado] = useState(false);
  const [cantidad, setCantidad] = useState(1);

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
    onAgregar(varianteElegida.varianteId, cantidad);
    setAgregado(true);
  }

  return (
    <div className="ui-selector-variantes">
      <div className="ui-selector-variantes__filas">
        <fieldset className="ui-selector-variantes__grupo">
          <legend className="ui-selector-variantes__titulo">Talla</legend>
          <div className="ui-selector-variantes__pastilla">
            {opciones.map((opcion) => (
              <button
                key={opcion.talla}
                type="button"
                className={
                  opcion.talla === talla
                    ? "ui-selector-variantes__talla ui-selector-variantes__talla--activa"
                    : "ui-selector-variantes__talla"
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
            <div className="ui-selector-variantes__pastilla">
              {coloresDeLaTalla.map((opcionColor) => {
                const muestra = muestraDe(opcionColor.color);
                const activo = opcionColor.color === color;
                return (
                  <button
                    key={opcionColor.color}
                    type="button"
                    className={
                      muestra === null
                        ? activo
                          ? "ui-selector-variantes__talla ui-selector-variantes__talla--activa ui-selector-variantes__talla--texto"
                          : "ui-selector-variantes__talla ui-selector-variantes__talla--texto"
                        : activo
                          ? "ui-selector-variantes__muestra ui-selector-variantes__muestra--activa"
                          : "ui-selector-variantes__muestra"
                    }
                    style={muestra === null ? undefined : ({ "--muestra": muestra } as React.CSSProperties)}
                    onClick={() => elegirColor(opcionColor.color)}
                    aria-pressed={activo}
                    aria-label={opcionColor.color}
                    title={opcionColor.color}
                  >
                    {muestra === null ? opcionColor.color : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}
      </div>

      <div className="ui-selector-variantes__barra">
        {!seleccionCompleta ? (
          <p className="ui-selector-variantes__aviso">Elige talla y color.</p>
        ) : null}
        <div className="ui-selector-variantes__acciones">
          <SelectorCantidad
            valor={cantidad}
            maximo={maximo}
            onCambio={(n) => {
              setCantidad(Math.min(Math.max(n, 1), maximo));
              setAgregado(false);
            }}
          />
          <button
            type="button"
            className="ui-selector-variantes__comprar"
            disabled={!seleccionCompleta || agregando}
            onClick={agregar}
          >
            {agregando ? "Agregando…" : agregado ? "Añadido ✓" : "Añadir al carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}
