import { etiquetaDeHora } from "@appweb/core/formato";

import "./franja-horas.css";

export interface PropsFranjaHoras {
  /** Lo que se mide: "Horas más activas". */
  titulo: string;
  /** 24 valores, uno por hora del reloj (0 a 23). */
  valores: number[];
  /** Cada valor como se lee en el titulo de la casilla: "6" o "S/ 120.00". */
  formatear: (valor: number) => string;
  /** Texto cuando ninguna hora tiene nada. */
  vacio?: string;
}

/**
 * Una tira de 24 casillas, una por hora del dia: cuanto mas intensa, mas pasa
 * en esa hora. A la derecha del titulo, la hora mas fuerte.
 */
export function FranjaHoras({
  titulo,
  valores,
  formatear,
  vacio = "Sin datos en este periodo",
}: PropsFranjaHoras) {
  const maximo = Math.max(0, ...valores);
  const pico = maximo > 0 ? valores.indexOf(maximo) : -1;
  const resumen = pico >= 0 ? `${titulo}: ${etiquetaDeHora(pico)}` : `${titulo}: ${vacio}`;

  return (
    <figure className="ui-franja-horas">
      <figcaption className="ui-franja-horas__cabecera">
        <span className="ui-franja-horas__titulo">{titulo}</span>
        <span className="ui-franja-horas__pico">{pico >= 0 ? etiquetaDeHora(pico) : vacio}</span>
      </figcaption>
      <div className="ui-franja-horas__celdas" role="img" aria-label={resumen}>
        {valores.map((valor, hora) => (
          <span
            // Las 24 horas son fijas: el indice es la hora misma.
            // biome-ignore lint/suspicious/noArrayIndexKey: la hora es la identidad de la casilla
            key={hora}
            className="ui-franja-horas__celda"
            title={`${etiquetaDeHora(hora)}: ${formatear(valor)}`}
            style={{ opacity: maximo > 0 ? 0.14 + 0.86 * (valor / maximo) : 0.14 }}
          />
        ))}
      </div>
      <div className="ui-franja-horas__eje" aria-hidden="true">
        <span>0 h</span>
        <span>12 h</span>
        <span>24 h</span>
      </div>
    </figure>
  );
}
