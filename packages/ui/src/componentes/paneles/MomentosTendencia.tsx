import "./momentos-tendencia.css";

export interface DatoMomento {
  /** Que dato es: sirve de clave. */
  tipo: "total" | "pico" | "actividad";
  /** Pregunta corta que responde la cifra: "Clientes este mes", "Mejor momento". */
  etiqueta: string;
  /** La cifra. Siempre en el color normal del texto. */
  valor: string;
  /** Porcentaje junto a la cifra, en texto suave: "50%", "29%". */
  insignia?: string;
  /** Flecha antes del porcentaje: "▲" o "▼". Es lo unico que lleva color (el del tono). */
  flecha?: string | null;
  /** Apoyo tenue tras la etiqueta: "mes pasado 17", "10 clientes". */
  nota?: string;
  /** Color de la flecha: sube en verde, baja en rojo. */
  tono?: "sube" | "baja" | "igual";
}

/**
 * Franja baja bajo la grafica, solo tipografia: cada dato es su cifra (con el
 * porcentaje al lado) y debajo su pregunta y una nota, separados del vecino por
 * una linea fina. Sin fondos ni insignias.
 */
export function MomentosTendencia({ datos }: { datos: DatoMomento[] }) {
  if (datos.length === 0) return null;
  return (
    <div className="ui-momentos-tendencia" role="group" aria-label="Resumen del periodo">
      {datos.map((dato) => (
        <div key={dato.tipo} className="ui-momentos-tendencia__dato">
          <div className="ui-momentos-tendencia__fila">
            <strong className="ui-momentos-tendencia__valor">{dato.valor}</strong>
            {dato.insignia ? (
              <span className="ui-momentos-tendencia__porcentaje">
                {dato.flecha ? (
                  <span
                    className={`ui-momentos-tendencia__flecha ui-momentos-tendencia__flecha--${dato.tono ?? "igual"}`}
                    aria-hidden="true"
                  >
                    {dato.flecha}{" "}
                  </span>
                ) : null}
                {dato.insignia}
              </span>
            ) : null}
          </div>
          <span className="ui-momentos-tendencia__pie">
            <span className="ui-momentos-tendencia__etiqueta">{dato.etiqueta}</span>
            {dato.nota ? <span className="ui-momentos-tendencia__nota"> · {dato.nota}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}
