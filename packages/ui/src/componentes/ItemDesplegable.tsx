"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconoChevronAbajo } from "../iconos";

import "./primitivos.css";

export interface EnlaceDeDesplegable {
  etiqueta: string;
  href: string;
}

export interface PropsItemDesplegable {
  etiqueta: string;
  items: EnlaceDeDesplegable[];
  /** Nodo ya renderizado (`<IconoTal tamano={14} />`), no el componente. */
  icono?: ReactNode;
}

/**
 * Item de NavegacionSecciones con submenu ("Ayuda ▾"). Isla cliente solo por
 * el abrir/cerrar — misma mecanica que SelectorUbicacion, sin localStorage.
 *
 * El panel usa `position: fixed` con coordenadas calculadas del disparador,
 * en vez de `absolute` dentro de su contenedor: la barra de secciones tiene
 * `overflow-x: auto` para hacer scroll en movil, y eso recorta cualquier
 * hijo `absolute` que se salga de su alto — el desplegable quedaba aplastado
 * dentro de la misma linea en vez de flotar debajo. `fixed` no lo sufre.
 */
export function ItemDesplegable({ etiqueta, items, icono }: PropsItemDesplegable) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function cerrar() {
      setAbierto(false);
    }
    function alHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) cerrar();
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    // Con `fixed`, la posicion calculada queda desactualizada si la pagina
    // se desplaza o cambia de tamaño mientras esta abierto: se cierra en vez
    // de arrastrar un panel mal ubicado.
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [abierto]);

  if (items.length === 0) return null;

  function alternar() {
    if (!abierto && contenedorRef.current) {
      const rect = contenedorRef.current.getBoundingClientRect();
      setPosicion({ top: rect.bottom + 4, left: rect.left });
    }
    setAbierto((valor) => !valor);
  }

  return (
    <div className="ui-item-desplegable" ref={contenedorRef}>
      <button
        type="button"
        className="ui-item-desplegable__disparador"
        onClick={alternar}
        aria-expanded={abierto}
      >
        {icono}
        <span>{etiqueta}</span>
        <IconoChevronAbajo tamano={14} />
      </button>
      {abierto ? (
        <ul
          className="ui-item-desplegable__lista"
          role="menu"
          style={{ top: posicion.top, left: posicion.left }}
        >
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
