"use client";

import { useRef, useState, useEffect } from "react";

import { IconoFlechaDerecha, IconoFlechaIzquierda } from "../iconos";
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

      {/* Ficha del producto visible: lecturas sueltas, como un panel de estado. */}
      <section className="ui-carrusel-portada__ficha" aria-label={`Detalles de ${producto.nombre}`}>
        <header className="ui-carrusel-portada__ficha-cabecera">
          <span>Estado</span>
          <span
            className={
              producto.disponible
                ? "ui-carrusel-portada__estado ui-carrusel-portada__estado--disponible"
                : "ui-carrusel-portada__estado ui-carrusel-portada__estado--agotado"
            }
          >
            {producto.disponible ? "Disponible" : "Agotado"}
          </span>
        </header>
        <dl className="ui-carrusel-portada__lecturas">
          {producto.categoria ? (
            <div><dt>Categoría</dt><dd>{producto.categoria}</dd></div>
          ) : null}
          {producto.marca ? (
            <div><dt>Marca</dt><dd>{producto.marca}</dd></div>
          ) : null}
          {producto.tallas && producto.tallas.length > 0 ? (
            <div><dt>Tallas</dt><dd>{producto.tallas.join(" · ")}</dd></div>
          ) : null}
          <div><dt>Descuento</dt><dd>{producto.descuentoPct ? `-${producto.descuentoPct}%` : "—"}</dd></div>
        </dl>
      </section>

      {productos.length > 1 ? (
        <>
          <ol className="ui-carrusel-portada__puntos" aria-label="Producto destacado">
            {productos.map((item, posicion) => (
              <li key={item.slug}>
                <button
                  type="button"
                  className="ui-carrusel-portada__punto"
                  aria-label={`Ver ${item.nombre}`}
                  aria-current={posicion === indiceVisible ? "true" : undefined}
                  onClick={() => setIndice(posicion)}
                />
              </li>
            ))}
          </ol>
          <div className="ui-carrusel-portada__controles">
            <button className="ui-carrusel-portada__flecha" type="button" aria-label="Ver producto anterior" onClick={() => mover(-1)}>
              <IconoFlechaIzquierda tamano={16} />
            </button>
            <button className="ui-carrusel-portada__flecha" type="button" aria-label="Ver producto siguiente" onClick={() => mover(1)}>
              <IconoFlechaDerecha tamano={16} />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
