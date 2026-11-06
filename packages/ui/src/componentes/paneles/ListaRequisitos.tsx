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

function Fila({ r }: { r: RequisitoDeLista }) {
  const estado = r.cumplido ? "cumplido" : r.obligatorio ? "falta" : "sugerido";
  return (
    <li className={`ui-lista-requisitos__fila ui-lista-requisitos__fila--${estado}`}>
      <span className="ui-lista-requisitos__icono" aria-hidden="true">
        {r.cumplido ? (
          <IconoMarcar tamano={14} />
        ) : r.obligatorio ? (
          <IconoCerrar tamano={14} />
        ) : null}
      </span>
      <span>{r.texto}</span>
      <span className="ui-solo-lectores">{r.cumplido ? ": listo" : ": falta"}</span>
    </li>
  );
}

/**
 * Lista de comprobacion en dos grupos: lo obligatorio (sin ello no se publica)
 * y lo recomendado. Un check por lo cumplido y una cruz por lo que falta.
 */
export function ListaRequisitos({ requisitos }: PropsListaRequisitos) {
  const obligatorios = requisitos.filter((r) => r.obligatorio);
  const recomendados = requisitos.filter((r) => !r.obligatorio);
  return (
    <div className="ui-lista-requisitos">
      {obligatorios.length > 0 ? (
        <section className="ui-lista-requisitos__grupo">
          <h3 className="ui-lista-requisitos__titulo">Obligatorio</h3>
          <ul className="ui-lista-requisitos__lista">
            {obligatorios.map((r) => (
              <Fila key={r.id} r={r} />
            ))}
          </ul>
        </section>
      ) : null}
      {recomendados.length > 0 ? (
        <section className="ui-lista-requisitos__grupo">
          <h3 className="ui-lista-requisitos__titulo">Recomendado</h3>
          <ul className="ui-lista-requisitos__lista">
            {recomendados.map((r) => (
              <Fila key={r.id} r={r} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
