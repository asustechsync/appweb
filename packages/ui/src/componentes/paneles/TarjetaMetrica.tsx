import { IconoMarcar, IconoTendenciaAlza, IconoTendenciaBaja } from "../../iconos";
import "./tarjeta-metrica.css";

export interface PropsTarjetaMetrica {
  etiqueta: string;
  /** Ya formateado por quien lo usa: "S/ 1,240" o "18". */
  valor: string;
  /** Cambio porcentual contra el periodo anterior. Sin esto no se pinta nada. */
  cambio?: number;
  /** El periodo anterior al pie de la cifra, ya formateado: { etiqueta: "Ayer", valor: "S/ 120.00" }. */
  anterior?: { etiqueta: string; valor: string };
  /** Al pie de la cifra: "3 pagos esperando". */
  contexto?: string;
  /** Para cifras donde bajar es lo bueno (rechazos, reembolsos): invierte verde y rojo. */
  menosEsMejor?: boolean;
  /** Con `onSeleccionar`, la tarjeta lleva un check: marcado = es la que se ve en la grafica. */
  seleccionada?: boolean;
  onSeleccionar?: () => void;
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
  anterior,
  contexto,
  menosEsMejor = false,
  seleccionada = false,
  onSeleccionar,
}: PropsTarjetaMetrica) {
  const tono = cambio === undefined ? null : tonoDe(cambio);
  // La flecha sigue la direccion; el color, si el cambio es bueno o malo.
  const color =
    menosEsMejor && tono === "sube" ? "baja" : menosEsMejor && tono === "baja" ? "sube" : tono;
  // Sin cambio no hay flecha ni diferencia que mostrar: solo el periodo anterior.
  const movio = tono === "sube" || tono === "baja";
  const [moneda, cifra] = partirMoneda(valor);

  return (
    <article className="ui-tarjeta-metrica">
      <header className="ui-tarjeta-metrica__cabecera">
        <span className="ui-tarjeta-metrica__etiqueta">{etiqueta}</span>
        {onSeleccionar ? (
          <button
            type="button"
            className={
              seleccionada
                ? "ui-tarjeta-metrica__check ui-tarjeta-metrica__check--marcado"
                : "ui-tarjeta-metrica__check"
            }
            aria-pressed={seleccionada}
            aria-label={`Ver ${etiqueta} en la gráfica`}
            onClick={onSeleccionar}
          >
            <IconoMarcar tamano={14} />
          </button>
        ) : null}
      </header>
      <div className="ui-tarjeta-metrica__cifra">
        <div className="ui-tarjeta-metrica__cuerpo">
          <p className="ui-tarjeta-metrica__valor">
            {moneda ? <span className="ui-tarjeta-metrica__moneda">{moneda}</span> : null}
            {cifra}
          </p>
        </div>
        {contexto || anterior || cambio !== undefined ? (
          <div className="ui-tarjeta-metrica__pie">
            {contexto ? <span className="ui-tarjeta-metrica__contexto">{contexto}</span> : null}
            {movio ? (
              <span
                className={`ui-tarjeta-metrica__flecha ui-tarjeta-metrica__flecha--${color}`}
                aria-hidden="true"
              >
                {tono === "sube" ? (
                  <IconoTendenciaAlza tamano={16} />
                ) : (
                  <IconoTendenciaBaja tamano={16} />
                )}
              </span>
            ) : null}
            {cambio !== undefined ? (
              <span
                className={`ui-tarjeta-metrica__diferencia ui-tarjeta-metrica__diferencia--${color}`}
              >
                {cambio > 0 ? "+" : cambio < 0 ? "−" : ""}
                {Math.abs(cambio)}%
              </span>
            ) : null}
            {anterior ? (
              // Sin color: es la referencia. El color va en lo que cambio.
              <span className="ui-tarjeta-metrica__contexto">
                vs {anterior.etiqueta.toLowerCase()}{" "}
                <span className="ui-tarjeta-metrica__anterior">{anterior.valor}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
