"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import "./estilos/hero.css";
import "./primitivos.css";

export interface DiapositivaHero {
  imagenUrl: string;
  titulo: string;
  subtitulo?: string;
  textoCta?: string;
  hrefCta?: string;
}

export interface PropsHero {
  diapositivas: DiapositivaHero[];
  /**
   * Contenido lateral opcional (p. ej. banners promocionales). Se recibe ya
   * renderizado desde un componente de servidor, igual que `fijo` en
   * Carrusel: no añade JS a este island aunque Hero sea cliente.
   */
  panelLateral?: ReactNode;
  /** Nombre accesible de la region, para lectores de pantalla. */
  etiqueta?: string;
}

const INTERVALO_MS = 6000;

/**
 * Vitrina principal de la portada: diapositivas a pantalla ancha con avance
 * automatico, mas un panel lateral opcional para banners informativos.
 *
 * Isla cliente solo por el avance automatico y las flechas/puntos. Las
 * diapositivas y el panel lateral llegan como datos/nodos ya resueltos —
 * ningun precio ni disponibilidad se calcula aqui.
 *
 * El avance se detiene con el mouse o el foco encima, y no arranca si el
 * visitante pidio "reduced motion" — sigue siendo navegable a mano.
 */
export function Hero({ diapositivas, panelLateral, etiqueta = "Destacados" }: PropsHero) {
  const [activa, setActiva] = useState(0);
  const [enPausa, setEnPausa] = useState(false);
  const total = diapositivas.length;

  useEffect(() => {
    if (total <= 1 || enPausa) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setActiva((i) => (i + 1) % total), INTERVALO_MS);
    return () => clearInterval(id);
  }, [total, enPausa]);

  const ir = useCallback((indice: number) => setActiva(((indice % total) + total) % total), [total]);

  if (total === 0) return null;

  return (
    <div className="ui-hero">
      <div
        className="ui-hero__vitrina"
        role="region"
        aria-roledescription="carrusel"
        aria-label={etiqueta}
        onMouseEnter={() => setEnPausa(true)}
        onMouseLeave={() => setEnPausa(false)}
        onFocus={() => setEnPausa(true)}
        onBlur={() => setEnPausa(false)}
      >
        {diapositivas.map((d, i) => (
          <div
            key={i}
            className="ui-hero__diapositiva"
            aria-hidden={i !== activa}
            style={{ opacity: i === activa ? 1 : 0, pointerEvents: i === activa ? "auto" : "none" }}
          >
            <Image
              src={d.imagenUrl}
              alt=""
              width={1200}
              height={860}
              sizes="(min-width: 64rem) 900px, 100vw"
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
            />
            <div className="ui-hero__texto">
              <h2 className="ui-hero__titulo">{d.titulo}</h2>
              {d.subtitulo ? <p className="ui-hero__subtitulo">{d.subtitulo}</p> : null}
              {d.textoCta && d.hrefCta ? (
                <Link className="ui-hero__cta" href={d.hrefCta} tabIndex={i === activa ? 0 : -1}>
                  {d.textoCta}
                </Link>
              ) : null}
            </div>
          </div>
        ))}

        {total > 1 ? (
          <>
            <button
              type="button"
              className="ui-hero__flecha ui-hero__flecha--prev"
              aria-label="Diapositiva anterior"
              onClick={() => ir(activa - 1)}
            >
              <Chevron sentido="izquierda" />
            </button>
            <button
              type="button"
              className="ui-hero__flecha ui-hero__flecha--next"
              aria-label="Diapositiva siguiente"
              onClick={() => ir(activa + 1)}
            >
              <Chevron sentido="derecha" />
            </button>

            <div className="ui-hero__puntos">
              {diapositivas.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === activa ? "ui-hero__punto ui-hero__punto--activo" : "ui-hero__punto"}
                  aria-label={`Ir a la diapositiva ${i + 1}`}
                  aria-current={i === activa}
                  onClick={() => ir(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {panelLateral ? <div className="ui-hero__panel">{panelLateral}</div> : null}
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
