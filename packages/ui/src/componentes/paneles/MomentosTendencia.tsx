import "./momentos-tendencia.css";

export interface DatoMomento {
  /** Que dato es: sirve de clave y de enganche de estilo. */
  tipo: "total" | "pico" | "actividad";
  /** "Hoy", "Hora pico", "Actividad". */
  etiqueta: string;
  /** La cifra grande, ya formateada: "▲ 20%", "33%". Va en el color del tono. */
  valor: string;
  /** Cifra corta de la nota, en negrita: "6", "2". */
  destacado?: string;
  /** Detalle tenue tras el destacado: "clientes", "de 6 clientes". */
  nota?: string;
  /** Color de la cifra grande: sube en verde, baja en rojo, info en azul, alerta en ambar. */
  tono?: "sube" | "baja" | "igual" | "info" | "alerta";
  /** Porcentaje 0-100 para la mini barra bajo la cifra. */
  parte?: number;
}

/**
 * Capsula aparte bajo la grafica con los datos clave del periodo en columnas:
 * total contra el periodo anterior, mejor punto, promedio y cuanto del periodo
 * tuvo actividad. Cada dato es etiqueta, cifra y una nota tenue.
 */
export function MomentosTendencia({ datos }: { datos: DatoMomento[] }) {
  if (datos.length === 0) return null;
  return (
    <div
      className="ui-momentos-tendencia"
      style={{ gridTemplateColumns: `repeat(${datos.length}, minmax(0, 1fr))` }}
      role="group"
      aria-label="Resumen del periodo"
    >
      {datos.map((dato) => (
        <div key={dato.tipo} className="ui-momentos-tendencia__dato">
          <span className="ui-momentos-tendencia__etiqueta">{dato.etiqueta}</span>
          <strong
            className={`ui-momentos-tendencia__valor ui-momentos-tendencia__valor--${dato.tono ?? "igual"}`}
          >
            {dato.valor}
          </strong>
          {dato.parte !== undefined ? (
            <span className="ui-momentos-tendencia__barra" aria-hidden="true">
              <span
                className="ui-momentos-tendencia__relleno"
                style={{ inlineSize: `${Math.min(100, Math.max(0, dato.parte))}%` }}
              />
            </span>
          ) : dato.destacado || dato.nota ? (
            <span className="ui-momentos-tendencia__nota">
              {dato.destacado ? (
                <b
                  className={`ui-momentos-tendencia__destacado ui-momentos-tendencia__destacado--${dato.tono ?? "igual"}`}
                >
                  {dato.destacado}
                </b>
              ) : null}
              {dato.destacado && dato.nota ? " " : null}
              {dato.nota}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
