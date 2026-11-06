import { Children, type ReactNode } from "react";

import { IconoFlechaAbajo } from "../../iconos";
import { LogoColor } from "./ListaActividad";

import "./grupo-color.css";

export interface PropsGrupoColor {
  /** Hex de la muestra, o `null` si el color no tiene. */
  muestra: string | null;
  nombre: string;
  /** Stock por talla, en el orden en que se muestran; `bajo` lo resalta. */
  tallas: { talla: string; stock: number; bajo: boolean }[];
  /** Las tarjetas de sus variantes; se ven al abrir el grupo. */
  children: ReactNode;
}

/**
 * Un color con el stock de cada talla en una sola linea. Cerrado ocupa poco;
 * abierto ocupa todo el ancho y muestra las variantes para editarlas.
 */
export function GrupoColor({ muestra, nombre, tallas, children }: PropsGrupoColor) {
  const total = tallas.reduce((suma, t) => suma + t.stock, 0);
  return (
    <details className="ui-grupo-color">
      <summary className="ui-grupo-color__cabecera">
        <LogoColor muestra={muestra} nombre={nombre} />
        <span className="ui-grupo-color__nombre">
          {nombre}
          <span className="ui-grupo-color__total">{total} u.</span>
        </span>
        <span className="ui-grupo-color__tallas">
          {tallas.map((t) => (
            <span
              key={t.talla}
              className={
                t.bajo
                  ? "ui-grupo-color__talla ui-grupo-color__talla--bajo"
                  : "ui-grupo-color__talla"
              }
            >
              {t.talla} {t.stock}
            </span>
          ))}
        </span>
        <span className="ui-grupo-color__flecha" aria-hidden="true">
          <IconoFlechaAbajo tamano={16} />
        </span>
      </summary>
      <div className="ui-grupo-color__cuerpo">{children}</div>
    </details>
  );
}

/**
 * Los grupos de color en dos columnas independientes desde tablet: al abrir uno,
 * solo empuja a los de su columna y la otra no deja un hueco.
 */
export function RejillaGrupos({ children }: { children: ReactNode }) {
  const grupos = Children.toArray(children);
  return (
    <div className="ui-rejilla-grupos">
      <div className="ui-rejilla-grupos__columna">{grupos.filter((_, i) => i % 2 === 0)}</div>
      <div className="ui-rejilla-grupos__columna">{grupos.filter((_, i) => i % 2 === 1)}</div>
    </div>
  );
}
