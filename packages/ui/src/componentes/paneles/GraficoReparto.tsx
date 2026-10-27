import "./grafico-reparto.css";

export type TonoReparto = "pistacho" | "lavanda" | "celeste" | "ambar" | "coral" | "grafito";

export interface ParteReparto {
  etiqueta: string;
  /** Porcentaje entero del total: la cifra grande y el largo de la barra. */
  porcentaje: number;
  /** El monto, ya formateado: "S/ 1,096.47". Se ve al pasar sobre el porcentaje. */
  valor: string;
  /** Color de la barra. */
  tono: TonoReparto;
  /** No recibio nada: la tarjeta sigue, apagada. */
  vacia?: boolean;
  /** Cifra grande propia en lugar del porcentaje: "S/ 1,860.00". */
  cifra?: string;
  /** Color de la cifra: verde una ganancia, rojo lo que se resta. */
  tonoCifra?: "exito" | "error";
  /** Linea suave al pie en lugar de la barra: "Lo que te queda". */
  nota?: string;
}

export interface PropsGraficoReparto {
  /** Titulo arriba a la izquierda: "Medios de pago". Sin el (ni `meta`) no hay cabecera. */
  titulo?: string;
  /** Arriba a la derecha, ya formateado: "S/ 1,389.42". */
  meta?: string;
  /** De mayor a menor; las vacias al final. */
  partes: ParteReparto[];
  /** "fila": sin cajas ni barras ni notas, solo cifras separadas por lineas finas. */
  variante?: "tarjetas" | "fila";
}

/**
 * Reparto de un total en mini tarjetas, una por parte: nombre, porcentaje en
 * grande (el monto en su title) y una barra fina que mide contra el total.
 */
export function GraficoReparto({
  titulo,
  meta,
  partes,
  variante = "tarjetas",
}: PropsGraficoReparto) {
  const enFila = variante === "fila";
  return (
    <section
      className={enFila ? "ui-grafico-reparto ui-grafico-reparto--fila" : "ui-grafico-reparto"}
      {...(titulo ? {} : { "aria-label": "Reparto" })}
    >
      {titulo || meta ? (
        <div className="ui-grafico-reparto__cabecera">
          {titulo ? <h3 className="ui-grafico-reparto__titulo">{titulo}</h3> : null}
          {meta ? <span className="ui-grafico-reparto__meta">{meta}</span> : null}
        </div>
      ) : null}
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
            {/* Como las tarjetas de metrica: nombre arriba, cifra grande y barra al pie.
                Sin logo: "Pagos recientes" ya muestra la marca de cada medio. */}
            <span className="ui-grafico-reparto__detalle">{parte.etiqueta}</span>
            <span
              className={
                parte.tonoCifra
                  ? `ui-grafico-reparto__porcentaje ui-grafico-reparto__porcentaje--${parte.tonoCifra}`
                  : "ui-grafico-reparto__porcentaje"
              }
              title={parte.valor}
            >
              {parte.cifra ?? `${parte.porcentaje}%`}
            </span>
            {enFila ? null : parte.nota ? (
              <span className="ui-grafico-reparto__nota">{parte.nota}</span>
            ) : (
              <span className="ui-grafico-reparto__pista" aria-hidden="true">
                <span
                  className={`ui-grafico-reparto__barra ui-grafico-reparto__barra--${parte.tono}`}
                  style={{ inlineSize: `${parte.porcentaje}%` }}
                />
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
