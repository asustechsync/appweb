"use client";

import "flag-icons/css/flag-icons.min.css";
import { useEffect, useMemo, useRef, useState } from "react";

import { PAISES } from "../datos/paises";
import { IconoFlechaAbajo } from "../iconos";

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
  const contenedorRef = useRef<HTMLDivElement>(null);
  const buscadorRef = useRef<HTMLInputElement>(null);

  const elegido = PAISES.find((pais) => pais.iso2 === valor) ?? PAISES[0]!;

  const visibles = useMemo(() => {
    const termino = SIN_TILDES(busqueda.trim().toLowerCase());
    if (termino === "") return PAISES.slice(0, cantidadInicial);
    return PAISES.filter(
      (pais) => SIN_TILDES(pais.nombre.toLowerCase()).includes(termino) || pais.prefijo.includes(termino),
    ).slice(0, 20);
  }, [busqueda, cantidadInicial]);

  useEffect(() => {
    if (!abierto) return;
    buscadorRef.current?.focus();

    function alHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) cerrar();
    }
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") cerrar();
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

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
        aria-expanded={abierto}
        onClick={() => setAbierto((valorPrevio) => !valorPrevio)}
      >
        <span className={`fi fi-${elegido.iso2} ui-selector-pais__bandera`} aria-hidden="true" />
        <span>+{elegido.prefijo}</span>
        <IconoFlechaAbajo tamano={12} />
      </button>

      {abierto ? (
        <div className="ui-selector-pais__panel" role="listbox">
          <input
            ref={buscadorRef}
            type="text"
            className="ui-selector-pais__buscador"
            placeholder="Buscar"
            aria-label="Buscar país o prefijo"
            inputMode="tel"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
          <ul
            className={
              visibles.length > 3
                ? "ui-selector-pais__lista ui-selector-pais__lista--con-scroll"
                : "ui-selector-pais__lista"
            }
          >
            {visibles.length === 0 ? (
              <li className="ui-selector-pais__vacio">Sin resultados</li>
            ) : (
              visibles.map((pais) => (
                <li key={pais.iso2}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={pais.iso2 === elegido.iso2}
                    className="ui-selector-pais__opcion"
                    title={pais.nombre}
                    onClick={() => elegir(pais.iso2)}
                  >
                    <span className={`fi fi-${pais.iso2} ui-selector-pais__bandera`} aria-hidden="true" />
                    <span className="ui-selector-pais__prefijo">+{pais.prefijo}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
