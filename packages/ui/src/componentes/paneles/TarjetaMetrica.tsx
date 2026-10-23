import { IconoTendenciaAlza, IconoTendenciaBaja } from "../../iconos";
import { Minigrafico } from "./Minigrafico";
import "./tarjeta-metrica.css";

export interface PropsTarjetaMetrica {
  etiqueta: string;
  /** Ya formateado por quien lo usa: "S/ 1,240" o "18". */
  valor: string;
  /** Cambio porcentual contra el periodo anterior. Sin esto no se pinta nada. */
  cambio?: number;
  /** Diferencia absoluta ya formateada, al lado de la flecha: "+S/ 120.00". */
  diferencia?: string;
  /** Valores del periodo en orden: se dibujan como minigrafico a la derecha. */
  serie?: number[];
  /** Al pie de la cifra, antes de la flecha: "vs. semana anterior". */
  contexto?: string;
}

/** Separa el simbolo de moneda del resto de la cifra: "S/ 12.50" -> ["S/", " 12.50"]. */
function partirMoneda(valor: string): [string, string] {
  const simbolo = /^S\/\s?/.exec(valor)?.[0];
  return simbolo ? [simbolo, valor.slice(simbolo.length)] : ["", valor];
}

/** Un numero del negocio con su cambio contra el periodo anterior. */
export function TarjetaMetrica({
  etiqueta,
  valor,
  cambio,
  diferencia,
  serie,
  contexto,
}: PropsTarjetaMetrica) {
  const sube = cambio !== undefined && cambio >= 0;
  const [moneda, cifra] = partirMoneda(valor);

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
      <div className="ui-tarjeta-metrica__cifra">
        <div className="ui-tarjeta-metrica__cuerpo">
          <p className="ui-tarjeta-metrica__valor">
            {moneda ? <span className="ui-tarjeta-metrica__moneda">{moneda}</span> : null}
            {cifra}
          </p>
          {serie ? <Minigrafico serie={serie} etiqueta={`${etiqueta} del periodo`} /> : null}
        </div>
        <div className="ui-tarjeta-metrica__pie">
          {contexto ? <span className="ui-tarjeta-metrica__contexto">{contexto}</span> : null}
          {cambio === undefined ? null : (
            <span
              className={
                sube
                  ? "ui-tarjeta-metrica__flecha ui-tarjeta-metrica__flecha--sube"
                  : "ui-tarjeta-metrica__flecha ui-tarjeta-metrica__flecha--baja"
              }
              aria-hidden="true"
            >
              {sube ? <IconoTendenciaAlza tamano={16} /> : <IconoTendenciaBaja tamano={16} />}
            </span>
          )}
          {cambio === undefined || !diferencia ? null : (
            <span
              className={
                sube
                  ? "ui-tarjeta-metrica__diferencia ui-tarjeta-metrica__diferencia--sube"
                  : "ui-tarjeta-metrica__diferencia ui-tarjeta-metrica__diferencia--baja"
              }
            >
              {diferencia}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
