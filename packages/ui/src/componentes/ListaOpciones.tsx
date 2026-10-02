import { useRef } from "react";

import { usarOpcionVisible } from "./usarOpcionVisible";

export interface OpcionDeLista {
  valor: string;
  etiqueta: string;
}

interface PropsListaOpciones {
  id: string;
  etiqueta: string;
  opciones: OpcionDeLista[];
  valor: string;
  indiceActivo: number;
  onActivar: (indice: number) => void;
  onElegir: (opcion: OpcionDeLista) => void;
  claseLista: string;
  claseOpcion: string;
}

/** Lista accesible compartida por selectores simples y buscables. */
export function ListaOpciones({
  id,
  etiqueta,
  opciones,
  valor,
  indiceActivo,
  onActivar,
  onElegir,
  claseLista,
  claseOpcion,
}: PropsListaOpciones) {
  const listaRef = useRef<HTMLUListElement>(null);
  usarOpcionVisible(listaRef, indiceActivo, `${opciones.length}:${opciones[0]?.valor ?? ""}`);

  return (
    <ul
      ref={listaRef}
      id={id}
      className={opciones.length > 4 ? `${claseLista} ${claseLista}--con-scroll` : claseLista}
      role="listbox"
      aria-label={etiqueta}
    >
      {opciones.length === 0 ? (
        <li className="ui-opciones__vacio">Sin resultados</li>
      ) : (
        opciones.map((opcion, indice) => (
          <li
            key={opcion.valor}
            id={`${id}-opcion-${indice}`}
            role="option"
            aria-selected={opcion.valor === valor}
            data-activa={indice === indiceActivo || undefined}
            className={claseOpcion}
            onMouseEnter={() => onActivar(indice)}
            onClick={() => onElegir(opcion)}
          >
            {opcion.etiqueta}
          </li>
        ))
      )}
    </ul>
  );
}
