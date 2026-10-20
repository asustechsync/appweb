import { CALIFICACION } from "@appweb/core/formato";

import { IconoEstrella, IconoEstrellaRellena } from "../../iconos";

import "../estilos.css";

export interface PropsEstrellas {
  /** Nota de 0 a 5. Se rellenan las estrellas de la nota redondeada. */
  valor: number;
  tamano?: number;
}

/** Cinco estrellas de solo lectura. El lector de pantalla escucha la nota, no cinco iconos. */
export function Estrellas({ valor, tamano = 16 }: PropsEstrellas) {
  const llenas = Math.round(valor);
  return (
    <span
      className="ui-estrellas"
      role="img"
      aria-label={`${CALIFICACION.format(valor)} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) =>
        n <= llenas ? (
          <IconoEstrellaRellena key={n} tamano={tamano} className="ui-estrellas__llena" />
        ) : (
          <IconoEstrella key={n} tamano={tamano} className="ui-estrellas__vacia" />
        ),
      )}
    </span>
  );
}
