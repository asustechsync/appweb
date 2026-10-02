"use client";

import "flag-icons/css/flag-icons.min.css";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { PAISES } from "../datos/paises";
import { IconoFlechaAbajo } from "../iconos";
import { navegarOpciones } from "./navegarOpciones";
import { usarCierreDesplegable } from "./usarCierreDesplegable";
import { usarOpcionVisible } from "./usarOpcionVisible";

import "./primitivos.css";
import "./estilos/selector-pais.css";

export interface PropsSelectorPais {
  id: string;
  /** iso2 del pais elegido ("pe"). */
  valor: string;
  onCambio: (iso2: string) => void;
  /** Cuantos paises mostrar antes de escribir nada. Por defecto 3. */
  cantidadInicial?: number;
}

const SIN_TILDES = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Combobox de prefijo telefonico con bandera, buscable por nombre o por
 * prefijo. Solo pinta banderas de la lista visible (los primeros N, o los
 * que calcen con la busqueda): con ~190 paises no tiene sentido montar las
 * 190 banderas si nadie las esta viendo.
 */
export function SelectorPais({ id, valor, onCambio, cantidadInicial = 3 }: PropsSelectorPais) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const buscadorRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const listaId = `${useId()}-opciones`;

  const elegido = PAISES.find((pais) => pais.iso2 === valor) ?? PAISES[0]!;

  const visibles = useMemo(() => {
    const termino = SIN_TILDES(busqueda.trim().toLowerCase());
    if (termino === "") return PAISES.slice(0, cantidadInicial);
    return PAISES.filter(
      (pais) => SIN_TILDES(pais.nombre.toLowerCase()).includes(termino) || pais.prefijo.includes(termino),
    ).slice(0, 20);
  }, [busqueda, cantidadInicial]);

  useEffect(() => {
    if (abierto) buscadorRef.current?.focus();
    else setBusqueda("");
  }, [abierto]);

  usarCierreDesplegable(abierto, contenedorRef, setAbierto);
  usarOpcionVisible(listaRef, indiceActivo, `${busqueda}:${visibles.length}`);

  function cerrar() {
    setAbierto(false);
    setBusqueda("");
  }

  function elegir(iso2: string) {
    onCambio(iso2);
    cerrar();
  }

  return (
    <div className="ui-selector-pais" ref={contenedorRef}>
      <button
        type="button"
        id={id}
        className="ui-selector-pais__disparador"
        aria-label={`Prefijo telefónico: +${elegido.prefijo}, ${elegido.nombre}`}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listaId : undefined}
        onClick={() => setAbierto((valorPrevio) => !valorPrevio)}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
            evento.preventDefault();
            setIndiceActivo(0);
            setAbierto(true);
          }
        }}
      >
        <span className={`fi fi-${elegido.iso2} ui-selector-pais__bandera`} aria-hidden="true" />
        <span>+{elegido.prefijo}</span>
        <IconoFlechaAbajo tamano={12} />
      </button>

      {abierto ? (
        <div className="ui-selector-pais__panel">
          <input
            ref={buscadorRef}
            type="text"
            className="ui-selector-pais__buscador"
            placeholder="Buscar"
            aria-label="Buscar país o prefijo"
            role="combobox"
            aria-expanded={abierto}
            aria-controls={listaId}
            aria-autocomplete="list"
            aria-activedescendant={visibles.length > 0 ? `${listaId}-opcion-${indiceActivo}` : undefined}
            inputMode="tel"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setIndiceActivo(0);
            }}
            onKeyDown={(evento) =>
              navegarOpciones({
                evento,
                abierto,
                cantidad: visibles.length,
                indiceActivo,
                abrir: () => setAbierto(true),
                activar: setIndiceActivo,
                elegir: (indice) => {
                  if (visibles[indice]) elegir(visibles[indice].iso2);
                },
              })
            }
          />
          <ul
            ref={listaRef}
            id={listaId}
            role="listbox"
            aria-label="Países"
            className={
              visibles.length > 3
                ? "ui-selector-pais__lista ui-selector-pais__lista--con-scroll"
                : "ui-selector-pais__lista"
            }
          >
            {visibles.length === 0 ? (
              <li className="ui-opciones__vacio">Sin resultados</li>
            ) : (
              visibles.map((pais, indice) => (
                <li
                  key={pais.iso2}
                  id={`${listaId}-opcion-${indice}`}
                  role="option"
                  aria-selected={pais.iso2 === elegido.iso2}
                  aria-label={`${pais.nombre}, +${pais.prefijo}`}
                  data-activa={indice === indiceActivo || undefined}
                  className="ui-selector-pais__opcion"
                  title={pais.nombre}
                  onMouseEnter={() => setIndiceActivo(indice)}
                  onClick={() => elegir(pais.iso2)}
                >
                  <span className={`fi fi-${pais.iso2} ui-selector-pais__bandera`} aria-hidden="true" />
                  <span className="ui-selector-pais__prefijo">+{pais.prefijo}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
