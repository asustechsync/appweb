"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { IconoFlechaDerecha, IconoFlechaIzquierda } from "../iconos";

import "./primitivos.css";

export interface PropsCarrusel {
  children: ReactNode;
  /** Se ancla a la izquierda, fuera de la pista: no se desliza con el resto. */
  fijo?: ReactNode;
  /** Nombre accesible de la region, para lectores de pantalla. */
  etiqueta?: string;
  /**
   * Vuelta continua: al pasar el ultimo item aparece de nuevo el primero, en
   * ambos sentidos y sin salto visible. Las flechas nunca se deshabilitan.
   */
  infinito?: boolean;
}

/**
 * Fila de items que se desliza en horizontal, una sola linea, con un
 * elemento fijo opcional que se queda anclado a la izquierda mientras el
 * resto se desliza. Muestra ~6 items en escritorio ademas del fijo; el resto
 * se llega con las flechas, deslizando con el dedo, el trackpad o la rueda
 * del mouse.
 *
 * Reutilizable para carruseles de productos, marcas, categorias, etc.
 *
 * El fijo y cada hijo de `children` miden lo mismo aunque vivan en
 * contenedores distintos: ambos usan `cqw` contra el mismo `container-type`
 * en `.ui-carrusel`, asi que el ancho no depende de cual sea su padre inmediato.
 *
 * Isla cliente: las flechas necesitan saber si ya se llego a un extremo
 * para deshabilitarse, y eso exige leer la posicion real del scroll. El
 * scroll en si sigue siendo nativo, no hay una libreria de carrusel.
 *
 * FIRST MOBILE: cuantos items se ven por vez sube por quiebres via la
 * variable `--visibles` en el CSS; aqui no hay medidas.
 */
export function Carrusel({ children, fijo, etiqueta = "Carrusel", infinito = false }: PropsCarrusel) {
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
    if (infinito) return;
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
  }, [revisarBordes, infinito]);

  // Modo infinito: los items van tres veces seguidas y se arranca en la copia
  // del medio. Cuando el scroll se asienta en una copia lateral, se salta
  // en seco un ancho de copia hacia el centro: el contenido es identico, asi
  // que el salto no se ve y siempre queda recorrido hacia ambos lados.
  useEffect(() => {
    if (!infinito) return;
    const pista = pistaRef.current;
    if (!pista) return;

    // Distancia entre el primer item de una copia y el de la siguiente. Se
    // mide en pantalla y no con scrollWidth / 3, porque el relleno de la
    // pista descuadraria la division.
    const anchoCopia = () => {
      const copias = pista.querySelectorAll<HTMLElement>(":scope > .ui-carrusel__copia");
      const primero = copias[0]?.firstElementChild;
      const segundo = copias[1]?.firstElementChild;
      if (!primero || !segundo) return 0;
      return segundo.getBoundingClientRect().left - primero.getBoundingClientRect().left;
    };

    const saltar = (delta: number) => {
      // Sin snap durante el salto: si no, el navegador vuelve a encajar y
      // ese encaje cancela el siguiente desliz suave de las flechas.
      pista.style.scrollSnapType = "none";
      pista.scrollLeft += delta;
      requestAnimationFrame(() => {
        pista.style.scrollSnapType = "";
      });
    };

    const recentrar = () => {
      const ancho = anchoCopia();
      if (ancho <= 0) return;
      if (pista.scrollLeft < ancho * 0.5) {
        saltar(ancho);
      } else if (pista.scrollLeft > ancho * 1.5) {
        saltar(-ancho);
      }
    };

    pista.scrollLeft = anchoCopia();

    // `scrollend` avisa al terminar el desliz suave o el dedo. No todos los
    // navegadores lo emiten siempre, asi que una pausa corta tras el ultimo
    // `scroll` hace de respaldo; recentrar dos veces no hace nada la segunda.
    let espera: ReturnType<typeof setTimeout> | undefined;
    const alDesplazar = () => {
      clearTimeout(espera);
      espera = setTimeout(recentrar, 140);
    };

    pista.addEventListener("scrollend", recentrar);
    pista.addEventListener("scroll", alDesplazar, { passive: true });

    const observador = new ResizeObserver(recentrar);
    observador.observe(pista);

    return () => {
      clearTimeout(espera);
      pista.removeEventListener("scrollend", recentrar);
      pista.removeEventListener("scroll", alDesplazar);
      observador.disconnect();
    };
  }, [infinito]);

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
    <div className="ui-carrusel" role="region" aria-roledescription="carrusel" aria-label={etiqueta}>
      {fijo ? <div className="ui-carrusel__fijo">{fijo}</div> : null}

      <div className="ui-carrusel__pista" ref={pistaRef}>
        {infinito ? (
          <>
            {/* Las copias laterales son solo visuales: fuera del foco y de
                los lectores de pantalla, que leen la lista una sola vez. */}
            <div className="ui-carrusel__copia" aria-hidden="true" inert>{children}</div>
            <div className="ui-carrusel__copia">{children}</div>
            <div className="ui-carrusel__copia" aria-hidden="true" inert>{children}</div>
          </>
        ) : (
          children
        )}
      </div>

      <button
        type="button"
        className="ui-carrusel__flecha ui-carrusel__flecha--prev"
        aria-label="Ver anteriores"
        onClick={() => desplazar(-1)}
        disabled={!infinito && alInicio}
      >
        <IconoFlechaIzquierda />
      </button>

      <button
        type="button"
        className="ui-carrusel__flecha ui-carrusel__flecha--next"
        aria-label="Ver siguientes"
        onClick={() => desplazar(1)}
        disabled={!infinito && alFinal}
      >
        <IconoFlechaDerecha />
      </button>
    </div>
  );
}
