import type { ReactNode } from "react";

import "./grafico-reparto.css";

export type TonoReparto = "pistacho" | "lavanda" | "celeste" | "ambar" | "coral" | "grafito";

export interface ParteReparto {
  etiqueta: string;
  /** Porcentaje entero del total: la cifra grande y el largo de la barra. */
  porcentaje: number;
  /** El monto bajo el nombre, ya formateado: "S/ 1,096.47". */
  valor: string;
  /** Color de la barra. */
  tono: TonoReparto;
  /** Logo arriba a la izquierda, ya renderizado: `<LogoMedioPago medio="yape" />`. */
  logo?: ReactNode;
  /** No recibio nada: la tarjeta sigue, apagada. */
  vacia?: boolean;
}

export interface PropsGraficoReparto {
  /** Titulo arriba a la izquierda: "Medios de pago". */
  titulo: string;
  /** Arriba a la derecha, ya formateado: "S/ 1,389.42". */
  meta?: string;
  /** De mayor a menor; las vacias al final. */
  partes: ParteReparto[];
}

/**
 * Reparto de un total en mini tarjetas, una por parte: logo, porcentaje en
 * grande, nombre y monto, y una barra fina que mide contra el total.
 */
export function GraficoReparto({ titulo, meta, partes }: PropsGraficoReparto) {
  return (
    <section className="ui-grafico-reparto">
      <div className="ui-grafico-reparto__cabecera">
        <h3 className="ui-grafico-reparto__titulo">{titulo}</h3>
        {meta ? <span className="ui-grafico-reparto__meta">{meta}</span> : null}
      </div>
      <ul className="ui-grafico-reparto__rejilla">
        {partes.map((parte) => (
          <li
            key={parte.etiqueta}
            className={
              parte.vacia
                ? "ui-grafico-reparto__parte ui-grafico-reparto__parte--vacia"
                : "ui-grafico-reparto__parte"
            }
          >
            {parte.logo ? <span className="ui-grafico-reparto__logo">{parte.logo}</span> : null}
            <span className="ui-grafico-reparto__porcentaje">{parte.porcentaje}%</span>
            <span className="ui-grafico-reparto__detalle">
              {parte.etiqueta} · {parte.valor}
            </span>
            <span className="ui-grafico-reparto__pista" aria-hidden="true">
              <span
                className={`ui-grafico-reparto__barra ui-grafico-reparto__barra--${parte.tono}`}
                style={{ inlineSize: `${parte.porcentaje}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
