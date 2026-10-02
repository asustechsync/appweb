"use client";

import { useId, useRef, useState } from "react";

import { IconoFlechaAbajo } from "../iconos";
import { ListaOpciones, type OpcionDeLista } from "./ListaOpciones";
import { navegarOpciones } from "./navegarOpciones";
import { usarCierreDesplegable } from "./usarCierreDesplegable";

import "./primitivos.css";
import "./estilos/selector-lista.css";

export type OpcionDeSelectorLista = OpcionDeLista;

export interface PropsSelectorLista {
  id?: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionDeSelectorLista[];
  onCambio: (valor: string) => void;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
}

/**
 * Como `SelectorBuscable`, pero sin escribir: un boton que abre el panel con
 * las opciones (hasta 4 a la vez, scroll para el resto) y se elige con clic.
 * Para listas cortas donde escribir no aporta nada (genero, tipo de documento).
 */
export function SelectorLista({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  disabled,
  placeholder,
}: PropsSelectorLista) {
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const listaId = `${useId()}-opciones`;

  usarCierreDesplegable(abierto, contenedorRef, setAbierto);

  const elegida = opciones.find((opcion) => opcion.valor === valor);

  function abrir() {
    setIndiceActivo(Math.max(0, opciones.findIndex((opcion) => opcion.valor === valor)));
    setAbierto(true);
  }

  function elegir(opcion: OpcionDeSelectorLista) {
    onCambio(opcion.valor);
    setAbierto(false);
  }

  return (
    <div className="ui-selector-lista" ref={contenedorRef}>
      <button
        type="button"
        id={id}
        className="ui-selector-lista__disparador"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listaId : undefined}
        aria-activedescendant={abierto ? `${listaId}-opcion-${indiceActivo}` : undefined}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={(evento) =>
          navegarOpciones({
            evento,
            abierto,
            cantidad: opciones.length,
            indiceActivo,
            abrir,
            activar: setIndiceActivo,
            elegir: (indice) => {
              if (opciones[indice]) elegir(opciones[indice]);
            },
          })
        }
      >
        <span className={elegida ? undefined : "ui-selector-lista__vacio"}>
          {elegida?.etiqueta ?? (placeholder ?? etiqueta)}
        </span>
        <IconoFlechaAbajo tamano={12} />
      </button>

      {abierto ? (
        <ListaOpciones
          id={listaId}
          etiqueta={etiqueta}
          opciones={opciones}
          valor={valor}
          indiceActivo={indiceActivo}
          onActivar={setIndiceActivo}
          onElegir={elegir}
          claseLista="ui-selector-lista__lista"
          claseOpcion="ui-selector-lista__opcion"
        />
      ) : null}
    </div>
  );
}
