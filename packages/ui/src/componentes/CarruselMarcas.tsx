"use client";

import { useRef, useEffect } from "react";

import { TarjetaMarca, type PropsTarjetaMarca } from "./TarjetaMarca";
import "./estilos/carrusel-marcas.css";

export interface PropsCarruselMarcas {
  marcas: PropsTarjetaMarca[];
  /** "vertical" (por defecto) para la columna junto al producto, "horizontal" para una franja. */
  orientacion?: "vertical" | "horizontal";
}

const DURACION_PASO_MS = 1200;
const VISIBLES = 6;

/** Arranca y frena despacio: el cambio de marca no se siente brusco. */
function suavizar(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Carrusel de marcas que se desplaza automáticamente, vertical u horizontal
 * segun `orientacion`. Muestra 6 marcas al iniciar pero contiene todas las
 * disponibles.
 *
 * El desplazamiento se anima a mano con requestAnimationFrame: el
 * `behavior: "smooth"` nativo no deja elegir duracion ni curva.
 *
 * Giro infinito: la lista se pinta dos veces. Cuando la pista termina de
 * recorrer la primera vuelta, se resta esa vuelta al scroll sin animar; la
 * copia ocupa exactamente el mismo lugar, asi que el salto no se ve.
 */
export function CarruselMarcas({ marcas, orientacion = "vertical" }: PropsCarruselMarcas) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const copiaRef = useRef<HTMLDivElement>(null);
  const gira = marcas.length > VISIBLES;
  const horizontal = orientacion === "horizontal";

  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista || !gira) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const eje = horizontal ? "offsetLeft" : "offsetTop";
    const scrollEje = horizontal ? "scrollLeft" : "scrollTop";

    let cuadro = 0;

    /** Distancia de una vuelta completa: de la primera marca a su copia. */
    function distanciaVuelta() {
      const primera = pista?.firstElementChild as HTMLElement | null;
      const primeraCopia = copiaRef.current?.firstElementChild as HTMLElement | null;
      return primera && primeraCopia ? primeraCopia[eje] - primera[eje] : 0;
    }

    function animarHasta(el: HTMLDivElement, destino: number) {
      cancelAnimationFrame(cuadro);
      const origen = el[scrollEje];
      const inicio = performance.now();

      const paso = (ahora: number) => {
        const t = Math.min((ahora - inicio) / DURACION_PASO_MS, 1);
        el[scrollEje] = origen + (destino - origen) * suavizar(t);
        if (t < 1) {
          cuadro = requestAnimationFrame(paso);
          return;
        }
        const vuelta = distanciaVuelta();
        if (vuelta > 0 && el[scrollEje] >= vuelta - 1) el[scrollEje] -= vuelta;
      };
      cuadro = requestAnimationFrame(paso);
    }

    const intervalo = setInterval(() => {
      const primero = pista.children[0] as HTMLElement | undefined;
      const segundo = pista.children[1] as HTMLElement | undefined;
      if (!primero || !segundo) return;

      // Distancia real entre tarjetas: ancho/alto mas el hueco del CSS.
      const avance = segundo[eje] - primero[eje];
      animarHasta(pista, pista[scrollEje] + avance);
    }, 5000);

    return () => {
      clearInterval(intervalo);
      cancelAnimationFrame(cuadro);
    };
  }, [gira, horizontal, marcas.length]);

  const claseSeccion = horizontal ? "ui-carrusel-marcas ui-carrusel-marcas--horizontal" : "ui-carrusel-marcas";

  return (
    <section className={claseSeccion} aria-label="Marcas destacadas">
      <div className="ui-carrusel-marcas__pista" ref={pistaRef}>
        {marcas.map((marca) => (
          <TarjetaMarca key={marca.slug} {...marca} />
        ))}
        {gira ? (
          // Copia solo visual: fuera del arbol de accesibilidad y del foco.
          <div className="ui-carrusel-marcas__copia" ref={copiaRef} aria-hidden="true" inert>
            {marcas.map((marca) => (
              <TarjetaMarca key={marca.slug} {...marca} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
