"use client";

import { useRef, useState, useEffect } from "react";

import { TarjetaProducto, type PropsTarjetaProducto } from "./TarjetaProducto";
import "./estilos/carrusel-portada.css";

export interface PropsCarruselPortada {
  productos: PropsTarjetaProducto[];
}

/** Producto destacado grande con flechas en escritorio y deslizamiento tactil. */
export function CarruselPortada({ productos }: PropsCarruselPortada) {
  const [indice, setIndice] = useState(0);
  const inicioDeslizamiento = useRef<{ x: number; y: number } | null>(null);
  const bloquearEnlaceHasta = useRef(0);

  useEffect(() => {
    if (productos.length < 2) return;
    const intervalo = setInterval(() => {
      setIndice((actual) => (actual + 1) % productos.length);
    }, 10000);
    return () => clearInterval(intervalo);
  }, [productos.length]);

  if (productos.length === 0) return null;

  const indiceVisible = Math.min(indice, productos.length - 1);
  const producto = productos[indiceVisible];
  if (!producto) return null;

  function mover(direccion: -1 | 1) {
    setIndice((actual) => (actual + direccion + productos.length) % productos.length);
  }

  return (
    <div
      className="ui-carrusel-portada"
      role="region"
      aria-label="Productos destacados"
      onTouchStart={(evento) => {
        const toque = evento.touches.length === 1 ? evento.touches[0] : null;
        inicioDeslizamiento.current = toque ? { x: toque.clientX, y: toque.clientY } : null;
      }}
      onTouchEnd={(evento) => {
        const inicio = inicioDeslizamiento.current;
        const fin = evento.changedTouches[0];
        inicioDeslizamiento.current = null;
        if (!inicio || !fin || productos.length < 2) return;

        const distanciaX = fin.clientX - inicio.x;
        const distanciaY = fin.clientY - inicio.y;
        if (Math.abs(distanciaX) < 48 || Math.abs(distanciaX) <= Math.abs(distanciaY) * 1.25) return;

        bloquearEnlaceHasta.current = Date.now() + 350;
        mover(distanciaX < 0 ? 1 : -1);
      }}
      onTouchCancel={() => { inicioDeslizamiento.current = null; }}
      onClickCapture={(evento) => {
        if (Date.now() < bloquearEnlaceHasta.current && (evento.target as Element).closest("a")) {
          evento.preventDefault();
          evento.stopPropagation();
        }
      }}
    >
      <TarjetaProducto {...producto} presentacion="portada" contexto="portada" />
      {productos.length > 1 ? (
        <>
          <button className="ui-carrusel-portada__flecha ui-carrusel-portada__flecha--anterior" type="button" aria-label="Ver producto anterior" onClick={() => mover(-1)}>
            <span aria-hidden="true">←</span>
          </button>
          <button className="ui-carrusel-portada__flecha ui-carrusel-portada__flecha--siguiente" type="button" aria-label="Ver producto siguiente" onClick={() => mover(1)}>
            <span aria-hidden="true">→</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
