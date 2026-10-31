import "./lista-requisitos.css";

import { IconoCerrar, IconoMarcar } from "../../iconos";

export interface RequisitoDeLista {
  id: string;
  texto: string;
  cumplido: boolean;
  /** Los opcionales que faltan se pintan como aviso, no como error. */
  obligatorio: boolean;
}

export interface PropsListaRequisitos {
  requisitos: RequisitoDeLista[];
}

/** Lista de comprobacion: un check por lo cumplido y una cruz por lo que falta. */
export function ListaRequisitos({ requisitos }: PropsListaRequisitos) {
  return (
    <ul className="ui-lista-requisitos">
      {requisitos.map((r) => {
        const estado = r.cumplido ? "cumplido" : r.obligatorio ? "falta" : "sugerido";
        return (
          <li
            key={r.id}
            className={`ui-lista-requisitos__fila ui-lista-requisitos__fila--${estado}`}
          >
            <span className="ui-lista-requisitos__icono" aria-hidden="true">
              {r.cumplido ? <IconoMarcar tamano={14} /> : <IconoCerrar tamano={14} />}
            </span>
            <span>
              {r.texto}
              {!r.cumplido && !r.obligatorio ? " (recomendado)" : null}
            </span>
            <span className="ui-solo-lectores">{r.cumplido ? ": listo" : ": falta"}</span>
          </li>
        );
      })}
    </ul>
  );
}
