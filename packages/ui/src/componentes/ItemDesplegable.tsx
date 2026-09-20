"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { IconoChevronAbajo } from "../iconos";

import "./primitivos.css";

export interface EnlaceDeDesplegable {
  etiqueta: string;
  href: string;
}

export interface PropsItemDesplegable {
  etiqueta: string;
  items: EnlaceDeDesplegable[];
}

/**
 * Item de NavegacionSecciones con submenu ("Categorias ▾", "Ayuda ▾").
 * Isla cliente solo por el abrir/cerrar — misma mecanica que
 * SelectorUbicacion, sin la parte de localStorage.
 */
export function ItemDesplegable({ etiqueta, items }: PropsItemDesplegable) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

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

  if (items.length === 0) return null;

  return (
    <div className="ui-item-desplegable" ref={contenedorRef}>
      <button
        type="button"
        className="ui-item-desplegable__disparador"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
      >
        <span>{etiqueta}</span>
        <IconoChevronAbajo tamano={12} />
      </button>
      {abierto ? (
        <ul className="ui-item-desplegable__lista" role="menu">
          {items.map((item) => (
            <li key={item.href} role="none">
              <Link role="menuitem" href={item.href} onClick={() => setAbierto(false)}>
                {item.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
