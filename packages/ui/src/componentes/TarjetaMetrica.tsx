import "./estilos/tarjeta-metrica.css";

export interface PropsTarjetaMetrica {
  etiqueta: string;
  /** Ya formateado por quien lo usa: "S/ 1,240" o "18". */
  valor: string;
  /** Cambio porcentual contra el periodo anterior. Sin esto no se pinta nada. */
  cambio?: number;
  /** Linea al pie: "vs. semana anterior". */
  contexto?: string;
}

/** Un numero del negocio con su cambio contra el periodo anterior. */
export function TarjetaMetrica({ etiqueta, valor, cambio, contexto }: PropsTarjetaMetrica) {
  const sube = cambio !== undefined && cambio >= 0;

  return (
    <article className="ui-tarjeta-metrica">
      <header className="ui-tarjeta-metrica__cabecera">
        <span className="ui-tarjeta-metrica__etiqueta">{etiqueta}</span>
        {cambio === undefined ? null : (
          <span
            className={
              sube
                ? "ui-tarjeta-metrica__cambio ui-tarjeta-metrica__cambio--sube"
                : "ui-tarjeta-metrica__cambio ui-tarjeta-metrica__cambio--baja"
            }
          >
            {sube ? "+" : "−"}
            {Math.abs(cambio)}%
          </span>
        )}
      </header>
      <p className="ui-tarjeta-metrica__valor">{valor}</p>
      {contexto ? <p className="ui-tarjeta-metrica__contexto">{contexto}</p> : null}
    </article>
  );
}
