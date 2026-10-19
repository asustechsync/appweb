"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { OpcionDeFiltro } from "./BarraFiltros";

import "../estilos.css";

export interface PropsOrdenDesplegable {
  titulo: string;
  opciones: OpcionDeFiltro[];
}

/**
 * Orden del listado como desplegable. Isla cliente solo para abrir y cerrar:
 * las opciones siguen siendo enlaces del servidor. Se cierra al hacer clic
 * fuera, con Escape y al elegir una opcion.
 */
export function OrdenDesplegable({ titulo, opciones }: PropsOrdenDesplegable) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const activa = opciones.find((opcion) => opcion.activa) ?? opciones[0];

  useEffect(() => {
    if (!abierto) return;

    function cerrar() {
      setAbierto(false);
    }
    function alHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) cerrar();
    }
    function alPulsarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") cerrar();
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("keydown", alPulsarTecla);
    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("keydown", alPulsarTecla);
    };
  }, [abierto]);

  return (
    <div className="ui-orden-desplegable" ref={contenedorRef}>
      <button
        type="button"
        className="ui-orden-desplegable__disparador"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        onClick={() => setAbierto((valor) => !valor)}
      >
        <span>
          {titulo}: {activa?.etiqueta}
        </span>
      </button>
      {abierto ? (
        <ul className="ui-orden-desplegable__lista" aria-label={titulo}>
          {opciones.map((opcion) => (
            <li key={opcion.href}>
              <Link
                className="ui-orden-desplegable__opcion"
                href={opcion.href}
                aria-current={opcion.activa ? "true" : undefined}
                scroll={false}
                onClick={() => setAbierto(false)}
              >
                {opcion.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
