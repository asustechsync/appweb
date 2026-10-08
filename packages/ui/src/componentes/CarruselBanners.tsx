"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { IconoFlechaDerecha, IconoFlechaIzquierda } from "../iconos";
import "./estilos/carrusel-banners.css";

export interface BannerDeslizable {
  etiqueta: string;
  titulo: string;
  detalle: string;
  href: string;
  accion: string;
  /** Tono pastel del fondo; sale de los tokens de estado. */
  tono: "oferta" | "nuevo" | "disponible";
}

export interface PropsCarruselBanners {
  banners: BannerDeslizable[];
  etiqueta: string;
}

/**
 * Un solo slide a todo el ancho donde se turnan los banners con un fundido.
 * Cada banner se difumina hacia abajo hasta el fondo de la web. Los banners
 * inactivos quedan `inert`: no reciben foco ni lectura de pantalla.
 */
export function CarruselBanners({ banners, etiqueta }: PropsCarruselBanners) {
  const [indice, setIndice] = useState(0);
  const inicioX = useRef<number | null>(null);

  useEffect(() => {
    if (banners.length < 2) return;
    const intervalo = setInterval(() => setIndice((actual) => (actual + 1) % banners.length), 8000);
    return () => clearInterval(intervalo);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const indiceVisible = Math.min(indice, banners.length - 1);

  function mover(direccion: -1 | 1) {
    setIndice((actual) => (actual + direccion + banners.length) % banners.length);
  }

  return (
    <div
      className="ui-carrusel-banners"
      role="region"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
      onTouchStart={(evento) => { inicioX.current = evento.touches[0]?.clientX ?? null; }}
      onTouchEnd={(evento) => {
        const inicio = inicioX.current;
        const fin = evento.changedTouches[0]?.clientX;
        inicioX.current = null;
        if (inicio === null || fin === undefined || Math.abs(fin - inicio) < 48) return;
        mover(fin < inicio ? 1 : -1);
      }}
    >
      {banners.map((banner, posicion) => {
        const activo = posicion === indiceVisible;
        return (
          <Link
            key={banner.href}
            className={`ui-carrusel-banners__banner ui-carrusel-banners__banner--${banner.tono}`}
            href={banner.href}
            aria-hidden={activo ? undefined : true}
            tabIndex={activo ? undefined : -1}
            data-activo={activo ? "true" : "false"}
            inert={!activo}
          >
            <span className="ui-carrusel-banners__etiqueta">{banner.etiqueta}</span>
            <span className="ui-carrusel-banners__titulo">{banner.titulo}</span>
            <span className="ui-carrusel-banners__detalle">{banner.detalle}</span>
            <span className="ui-carrusel-banners__accion">{banner.accion} <span aria-hidden="true">↗</span></span>
          </Link>
        );
      })}

      {banners.length > 1 ? (
        <div className="ui-carrusel-banners__controles">
          <ol className="ui-carrusel-banners__puntos" aria-label={etiqueta}>
            {banners.map((item, posicion) => (
              <li key={item.href}>
                <button
                  type="button"
                  className="ui-carrusel-banners__punto"
                  aria-label={`Ver ${item.titulo}`}
                  aria-current={posicion === indiceVisible ? "true" : undefined}
                  onClick={() => setIndice(posicion)}
                />
              </li>
            ))}
          </ol>
          <div className="ui-carrusel-banners__flechas">
            <button className="ui-carrusel-banners__flecha" type="button" aria-label="Ver banner anterior" onClick={() => mover(-1)}>
              <IconoFlechaIzquierda tamano={16} />
            </button>
            <button className="ui-carrusel-banners__flecha" type="button" aria-label="Ver banner siguiente" onClick={() => mover(1)}>
              <IconoFlechaDerecha tamano={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
