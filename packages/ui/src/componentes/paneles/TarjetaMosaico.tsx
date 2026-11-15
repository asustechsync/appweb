import "./tarjeta-mosaico.css";

export interface FilaMosaico {
  etiqueta: string;
  /** Cifra ya formateada: "− S/ 1,050.00". */
  valor: string;
  /** Color de la cifra: rojo para lo que resta, ambar para lo que espera. */
  tono?: "error" | "alerta" | "neutro";
}

export interface PropsTarjetaMosaico {
  /** Nombre accesible del bloque: "Caja del mes". No se muestra. */
  titulo: string;
  /** La cifra protagonista, bajo el medio anillo. */
  principal: {
    etiqueta: string;
    /** La cifra grande, ya formateada. */
    valor: string;
    /** Junto a la etiqueta: "48%". */
    lateral?: string;
    /** Arco del medio anillo, de 0 a 100: que parte de lo cobrado queda. */
    progreso?: number;
  };
  /** Una linea bajo el arco: "de S/ 1,850.00 cobrados en 3 pagos". */
  detalle?: string;
  /** Los dos datos de apoyo, uno junto al otro. */
  filas: [FilaMosaico, FilaMosaico];
  /** Pie: un texto a cada lado. */
  pie?: [string, string];
}

/**
 * Tarjeta en mosaico: un medio anillo de porcentaje con la cifra protagonista
 * al centro y, debajo, una linea de detalle y dos datos de apoyo lado a lado.
 */
export function TarjetaMosaico({ titulo, principal, detalle, filas, pie }: PropsTarjetaMosaico) {
  const progreso = Math.min(100, Math.max(0, principal.progreso ?? 0));
  return (
    <section className="ui-tarjeta-mosaico" aria-label={titulo}>
      <div className="ui-tarjeta-mosaico__rejilla">
        <div className="ui-tarjeta-mosaico__principal">
          {principal.progreso !== undefined ? (
            <svg
              className="ui-tarjeta-mosaico__medio-anillo"
              viewBox="0 0 120 66"
              preserveAspectRatio="xMidYMax meet"
              aria-hidden="true"
            >
              <path
                className="ui-tarjeta-mosaico__anillo-pista"
                d="M12 60 A48 48 0 0 1 108 60"
                pathLength={100}
              />
              <path
                className="ui-tarjeta-mosaico__anillo-arco"
                d="M12 60 A48 48 0 0 1 108 60"
                pathLength={100}
                strokeDasharray={`${progreso} 100`}
              />
            </svg>
          ) : null}
          <div className="ui-tarjeta-mosaico__texto">
            <strong className="ui-tarjeta-mosaico__cifra">{principal.valor}</strong>
            <span className="ui-tarjeta-mosaico__etiqueta">
              {principal.etiqueta}
              {principal.lateral ? ` · ${principal.lateral}` : ""}
            </span>
          </div>
        </div>

        {detalle ? <p className="ui-tarjeta-mosaico__detalle">{detalle}</p> : null}

        <div className="ui-tarjeta-mosaico__filas">
          {filas.map((fila) => (
            <div key={fila.etiqueta} className="ui-tarjeta-mosaico__fila">
              <span className="ui-tarjeta-mosaico__fila-etiqueta">{fila.etiqueta}</span>
              <strong
                className={`ui-tarjeta-mosaico__fila-valor ui-tarjeta-mosaico__fila-valor--${fila.tono ?? "neutro"}`}
              >
                {fila.valor}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {pie ? (
        <div className="ui-tarjeta-mosaico__pie">
          <span>{pie[0]}</span>
          <span>{pie[1]}</span>
        </div>
      ) : null}
    </section>
  );
}
