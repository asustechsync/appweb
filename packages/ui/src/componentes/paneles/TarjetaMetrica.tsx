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
  /** El periodo anterior al pie de la cifra, ya formateado: { etiqueta: "Ayer", valor: "S/ 120.00" }. */
  anterior?: { etiqueta: string; valor: string };
  /** Valores del periodo en orden: se dibujan como minigrafico a la derecha. */
  serie?: number[];
  /** El periodo anterior entero en los mismos tramos: linea punteada detras de `serie`. */
  seriePrevia?: number[];
  /** Al pie de la cifra: "3 pagos esperando". */
  contexto?: string;
}

/** Separa el simbolo de moneda del resto de la cifra: "S/ 12.50" -> ["S/", " 12.50"]. */
function partirMoneda(valor: string): [string, string] {
  const simbolo = /^S\/\s?/.exec(valor)?.[0];
  return simbolo ? [simbolo, valor.slice(simbolo.length)] : ["", valor];
}

/** Verde si subio, rojo si bajo, gris si quedo igual: 0% no es una subida. */
function tonoDe(cambio: number): "sube" | "baja" | "igual" {
  if (cambio > 0) return "sube";
  if (cambio < 0) return "baja";
  return "igual";
}

/** Un numero del negocio con su cambio contra el periodo anterior. */
export function TarjetaMetrica({
  etiqueta,
  valor,
  cambio,
  diferencia,
  anterior,
  serie,
  seriePrevia,
  contexto,
}: PropsTarjetaMetrica) {
  const tono = cambio === undefined ? null : tonoDe(cambio);
  // Sin cambio no hay flecha ni diferencia que mostrar: solo el periodo anterior.
  const movio = tono === "sube" || tono === "baja";
  const [moneda, cifra] = partirMoneda(valor);

  return (
    <article className="ui-tarjeta-metrica">
      <header className="ui-tarjeta-metrica__cabecera">
        <span className="ui-tarjeta-metrica__etiqueta">{etiqueta}</span>
        {cambio === undefined ? null : (
          <span className={`ui-tarjeta-metrica__cambio ui-tarjeta-metrica__cambio--${tono}`}>
            {cambio > 0 ? "+" : cambio < 0 ? "−" : ""}
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
          {serie ? (
            <Minigrafico
              serie={serie}
              {...(seriePrevia ? { seriePrevia } : {})}
              etiqueta={`${etiqueta} del periodo`}
            />
          ) : null}
        </div>
        {contexto || anterior || movio ? (
          <div className="ui-tarjeta-metrica__pie">
            {contexto ? <span className="ui-tarjeta-metrica__contexto">{contexto}</span> : null}
            {movio ? (
              <span
                className={`ui-tarjeta-metrica__flecha ui-tarjeta-metrica__flecha--${tono}`}
                aria-hidden="true"
              >
                {tono === "sube" ? (
                  <IconoTendenciaAlza tamano={16} />
                ) : (
                  <IconoTendenciaBaja tamano={16} />
                )}
              </span>
            ) : null}
            {movio && diferencia ? (
              <span
                className={`ui-tarjeta-metrica__diferencia ui-tarjeta-metrica__diferencia--${tono}`}
              >
                {diferencia}
              </span>
            ) : null}
            {anterior ? (
              // Sin color: es la referencia. El color va en lo que cambio.
              <span className="ui-tarjeta-metrica__contexto">
                {anterior.etiqueta}{" "}
                <span className="ui-tarjeta-metrica__anterior">{anterior.valor}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
