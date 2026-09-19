"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import "./primitivos.css";

export interface PropsCarruselProductos {
  children: ReactNode;
  /** Se ancla a la izquierda, fuera de la pista: no se desliza con el resto. */
  fijo?: ReactNode;
  /** Nombre accesible de la region, para lectores de pantalla. */
  etiqueta?: string;
}

/**
 * Fila de tarjetas que se desliza en horizontal, una sola linea, con un
 * elemento fijo opcional (el banner de oferta) que se queda anclado a la
 * izquierda mientras el resto se desliza. Muestra ~6 tarjetas en escritorio
 * ademas del fijo; el resto se llega con las flechas, deslizando con el
 * dedo, el trackpad o la rueda del mouse.
 *
 * `fijo` y cada tarjeta de `children` miden lo mismo aunque vivan en
 * contenedores distintos: ambos usan `cqw` contra el mismo `container-type`
 * en `.ui-carrusel-productos`, asi que el ancho no depende de cual sea su
 * padre inmediato.
 *
 * Isla cliente: las flechas necesitan saber si ya se llego a un extremo
 * para deshabilitarse, y eso exige leer la posicion real del scroll. El
 * scroll en si sigue siendo nativo, no hay una libreria de carrusel.
 *
 * FIRST MOBILE: cuantas tarjetas se ven por vez sube por quiebres via la
 * variable `--visibles` en el CSS; aqui no hay medidas.
 */
export function CarruselProductos({ children, fijo, etiqueta = "Productos" }: PropsCarruselProductos) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const [alInicio, setAlInicio] = useState(true);
  const [alFinal, setAlFinal] = useState(true);

  const revisarBordes = useCallback(() => {
    const pista = pistaRef.current;
    if (!pista) return;
    const margen = 2; // holgura para redondeos de subpixel
    setAlInicio(pista.scrollLeft <= margen);
    setAlFinal(pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - margen);
  }, []);

  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return;

    revisarBordes();
    pista.addEventListener("scroll", revisarBordes, { passive: true });

    const observador = new ResizeObserver(revisarBordes);
    observador.observe(pista);

    return () => {
      pista.removeEventListener("scroll", revisarBordes);
      observador.disconnect();
    };
  }, [revisarBordes]);

  function desplazar(sentido: 1 | -1) {
    const pista = pistaRef.current;
    if (!pista) return;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Casi un ancho visible: avanza "de pagina" sin perder el hilo.
    pista.scrollBy({
      left: sentido * pista.clientWidth * 0.9,
      behavior: suave ? "smooth" : "auto",
    });
  }

  return (
    <div className="ui-carrusel-productos" role="region" aria-roledescription="carrusel" aria-label={etiqueta}>
      {fijo ? <div className="ui-carrusel-productos__fijo">{fijo}</div> : null}

      <div className="ui-carrusel-productos__pista" ref={pistaRef}>
        {children}
      </div>

      <button
        type="button"
        className="ui-carrusel-productos__flecha ui-carrusel-productos__flecha--prev"
        aria-label="Ver anteriores"
        onClick={() => desplazar(-1)}
        disabled={alInicio}
      >
        <Chevron sentido="izquierda" />
      </button>

      <button
        type="button"
        className="ui-carrusel-productos__flecha ui-carrusel-productos__flecha--next"
        aria-label="Ver siguientes"
        onClick={() => desplazar(1)}
        disabled={alFinal}
      >
        <Chevron sentido="derecha" />
      </button>
    </div>
  );
}

function Chevron({ sentido }: { sentido: "izquierda" | "derecha" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {sentido === "izquierda" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}
