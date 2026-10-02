"use client";

import { useEffect, useId, useRef, useState } from "react";

import { IconoFlechaAbajo } from "../iconos";
import { ListaOpciones, type OpcionDeLista } from "./ListaOpciones";
import { navegarOpciones } from "./navegarOpciones";
import { usarCierreDesplegable } from "./usarCierreDesplegable";

import "./primitivos.css";
import "./estilos/selector-buscable.css";

export type OpcionDeSelectorBuscable = OpcionDeLista;

export interface PropsSelectorBuscable {
  id?: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionDeSelectorBuscable[];
  onCambio: (valor: string) => void;
  disabled?: boolean | undefined;
  placeholder?: string;
}

/**
 * Disparador escribible: filtra `opciones` con lo que se tipea y muestra
 * hasta 4 a la vez, con scroll para el resto. Usado por `SelectorFecha` (dia,
 * mes, año) en vez de un <select> nativo, cuyo desplegable no se puede
 * limitar en alto.
 */
export function SelectorBuscable({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  disabled,
  placeholder,
}: PropsSelectorBuscable) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const listaId = `${useId()}-opciones`;

  const elegida = opciones.find((opcion) => opcion.valor === valor);

  // Mientras esta cerrado, el input muestra lo elegido; al abrir/escribir
  // pasa a mostrar lo que la persona tipeo, para poder filtrar con eso.
  useEffect(() => {
    if (!abierto) setTexto("");
  }, [abierto]);

  usarCierreDesplegable(abierto, contenedorRef, setAbierto);

  const termino = texto.trim().toLowerCase();
  const visibles =
    termino === ""
      ? opciones
      : opciones.filter(
          (opcion) =>
            opcion.etiqueta.toLowerCase().includes(termino) || opcion.valor.startsWith(termino),
        );

  function abrir() {
    setIndiceActivo(Math.max(0, visibles.findIndex((opcion) => opcion.valor === valor)));
    setAbierto(true);
  }

  function elegir(opcion: OpcionDeSelectorBuscable) {
    onCambio(opcion.valor);
    setAbierto(false);
  }

  return (
    <div className="ui-selector-buscable" ref={contenedorRef}>
      <input
        id={id}
        type="text"
        className="ui-selector-buscable__disparador"
        disabled={disabled}
        placeholder={placeholder ?? etiqueta}
        role="combobox"
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-controls={abierto ? listaId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={abierto && visibles.length > 0 ? `${listaId}-opcion-${indiceActivo}` : undefined}
        autoComplete="off"
        value={abierto ? texto : (elegida?.etiqueta ?? "")}
        onFocus={abrir}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setIndiceActivo(0);
          setAbierto(true);
        }}
        onKeyDown={(evento) =>
          navegarOpciones({
            evento,
            abierto,
            cantidad: visibles.length,
            indiceActivo,
            abrir,
            activar: setIndiceActivo,
            elegir: (indice) => {
              if (visibles[indice]) elegir(visibles[indice]);
            },
          })
        }
      />
      <IconoFlechaAbajo tamano={12} className="ui-selector-buscable__flecha" />

      {abierto ? (
        <ListaOpciones
          id={listaId}
          etiqueta={etiqueta}
          opciones={visibles}
          valor={valor}
          indiceActivo={indiceActivo}
          onActivar={setIndiceActivo}
          onElegir={elegir}
          claseLista="ui-selector-buscable__lista"
          claseOpcion="ui-selector-buscable__opcion"
        />
      ) : null}
    </div>
  );
}
