"use client";

import { useEffect, useRef, useState } from "react";

import { IconoChevronAbajo, IconoUbicacion } from "../iconos";

import "./primitivos.css";

const UBICACION_LLAVE = "appweb:ubicacion";
const UBICACION_DEFECTO = "Tacna, Tacna";

// Mock: todavia no hay geolocalizacion ni catalogo de ciudades en la base.
// Cuando exista, esta lista sale de una consulta cacheada en vez de aqui.
const UBICACIONES_MOCK = [
  "Tacna, Tacna",
  "Lima, Miraflores",
  "Arequipa, Cercado",
  "Cusco, Cercado",
  "Trujillo, Cercado",
];

/**
 * Selector de ubicacion en la barra de secciones, debajo de la cabecera.
 *
 * Mock por ahora: la lista de ciudades es fija y la seleccion solo se
 * recuerda en localStorage, no filtra stock ni envios todavia. El dia que
 * haya cobertura real por ciudad, este componente pasa a recibir la lista
 * por props en vez de traerla de UBICACIONES_MOCK.
 */
export function SelectorUbicacion() {
  const [ubicacion, setUbicacion] = useState(UBICACION_DEFECTO);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(UBICACION_LLAVE);
      if (guardada) setUbicacion(guardada);
    } catch {
      /* almacenamiento no disponible: se queda con la ubicacion por defecto */
    }
  }, []);

  useEffect(() => {
    if (!abierto) return;
    function alHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    return () => document.removeEventListener("mousedown", alHacerClicFuera);
  }, [abierto]);

  function elegir(nueva: string) {
    setUbicacion(nueva);
    setAbierto(false);
    try {
      localStorage.setItem(UBICACION_LLAVE, nueva);
    } catch {
      /* almacenamiento no disponible: el cambio dura lo que dure la pestaña */
    }
  }

  return (
    <div className="ui-selector-ubicacion" ref={contenedorRef}>
      <button
        type="button"
        className="ui-selector-ubicacion__disparador"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
      >
        <IconoUbicacion />
        <span>{ubicacion}</span>
        <IconoChevronAbajo />
      </button>
      {abierto ? (
        <ul className="ui-selector-ubicacion__lista" role="listbox">
          {UBICACIONES_MOCK.map((opcion) => (
            <li key={opcion}>
              <button
                type="button"
                role="option"
                aria-selected={opcion === ubicacion}
                onClick={() => elegir(opcion)}
              >
                {opcion}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
