import "./primitivos.css";

export interface PasoDeLinea {
  etiqueta: string;
  situacion: "hecho" | "actual" | "pendiente";
}

export interface PropsLineaEstados {
  pasos: PasoDeLinea[];
}

/**
 * Seguimiento del pedido: un punto por estado, unidos por una linea. Los
 * pasos llegan ya resueltos de `pasosDelPedido` de @appweb/core.
 * Vertical en movil, horizontal desde 40rem.
 */
export function LineaEstados({ pasos }: PropsLineaEstados) {
  return (
    <ol className="ui-linea-estados">
      {pasos.map((paso) => (
        <li
          key={paso.etiqueta}
          className={`ui-linea-estados__paso ui-linea-estados__paso--${paso.situacion}`}
          aria-current={paso.situacion === "actual" ? "step" : undefined}
        >
          <span className="ui-linea-estados__punto" aria-hidden="true">
            {paso.situacion === "hecho" ? (
              <svg viewBox="0 0 16 16">
                <path d="M4 8.5 7 11l5-6" />
              </svg>
            ) : null}
          </span>
          <span className="ui-linea-estados__etiqueta">{paso.etiqueta}</span>
        </li>
      ))}
    </ol>
  );
}
