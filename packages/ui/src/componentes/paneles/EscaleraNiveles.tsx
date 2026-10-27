import type { ReactNode } from "react";

import type { IdNivel } from "@appweb/core";

import "./niveles.css";

export type TonoNivel = "basico" | "bronce" | "plata" | "oro" | "platino";

/** El color de cada nivel, igual en el panel y en "Mi cuenta": escalera, tarjetas y etiquetas. */
export const TONO_NIVEL: Record<IdNivel, TonoNivel> = {
  BASICO: "basico",
  BRONCE: "bronce",
  PLATA: "plata",
  ORO: "oro",
  PLATINO: "platino",
};

export interface TramoNivel {
  id: string;
  nombre: string;
  /** Desde cuanto se entra; solo para el ancho del tramo. */
  desde: number;
  /** Ya formateado: "desde S/ 300 y 3 pedidos". */
  etiquetaDesde: string;
  /** Linea corta junto al nombre: "5% de descuento". */
  detalle?: string;
  tono: TonoNivel;
}

export interface PropsEscaleraNiveles {
  /** En orden, del primero al ultimo. */
  tramos: TramoNivel[];
}

/**
 * Barra con un tramo por nivel, ancho segun lo que pide cada uno, y debajo la
 * leyenda con nombre, monto y beneficio. Se redibuja mientras se edita.
 *
 * Los montos van en la leyenda y no sobre la barra: en movil los tramos
 * cortos no dejan sitio para un texto encima.
 */
export function EscaleraNiveles({ tramos }: PropsEscaleraNiveles) {
  const ultimo = tramos.at(-1)?.desde ?? 0;
  // El ultimo nivel no tiene techo: se le da un tercio extra para que se vea.
  const total = ultimo > 0 ? ultimo * 1.35 : 1;

  return (
    <div className="ui-escalera-niveles">
      <div className="ui-escalera-niveles__barra" aria-hidden="true">
        {tramos.map((tramo, i) => {
          const hasta = tramos[i + 1]?.desde ?? total;
          const ancho = Math.max(0, ((hasta - tramo.desde) / total) * 100);
          return (
            <span
              key={tramo.id}
              className={`ui-escalera-niveles__tramo ui-escalera-niveles__tramo--${tramo.tono}`}
              style={{ flexBasis: `${ancho}%` }}
            />
          );
        })}
      </div>
      <ul className="ui-escalera-niveles__leyenda">
        {tramos.map((tramo) => (
          <li key={tramo.id} className="ui-escalera-niveles__item">
            <PuntoNivel tono={tramo.tono} />
            <span className="ui-escalera-niveles__nombre">{tramo.nombre}</span>
            <span className="ui-escalera-niveles__dato">
              {tramo.etiquetaDesde}
              {tramo.detalle ? ` · ${tramo.detalle}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Circulo del color del nivel. */
export function PuntoNivel({ tono }: { tono: TonoNivel }) {
  return <span className={`ui-punto-nivel ui-punto-nivel--${tono}`} aria-hidden="true" />;
}

/** El nombre del nivel en una etiqueta teñida con su color: "Platino". */
export function InsigniaNivel({ tono, children }: { tono: TonoNivel; children: ReactNode }) {
  return <span className={`ui-insignia-nivel ui-insignia-nivel--${tono}`}>{children}</span>;
}

export interface PropsTarjetaNivel {
  nombre: string;
  tono: TonoNivel;
  /** Los campos del nivel. */
  children: ReactNode;
}

/** Tarjeta de un nivel con su color: el formulario de ese nivel va dentro. */
export function TarjetaNivel({ nombre, tono, children }: PropsTarjetaNivel) {
  return (
    <article className={`ui-tarjeta-nivel ui-tarjeta-nivel--${tono}`}>
      <header className="ui-tarjeta-nivel__cabecera">
        <PuntoNivel tono={tono} />
        <h3 className="ui-tarjeta-nivel__nombre">{nombre}</h3>
      </header>
      <div className="ui-tarjeta-nivel__cuerpo">{children}</div>
    </article>
  );
}

/** Fila de `TarjetaNivel`: una columna en movil, tantas como quepan al ensanchar. */
export function RejillaNiveles({ children }: { children: ReactNode }) {
  return <div className="ui-rejilla-niveles">{children}</div>;
}

export interface PropsProgresoNivel {
  /** "Nivel Plata". */
  titulo: string;
  /** "5% en cada compra". */
  detalle?: string;
  /** De 0 a 100. */
  progresoPct: number;
  /** "Te faltan S/ 190 para llegar a Oro". */
  pie: string;
  tono: TonoNivel;
}

/** El nivel de un cliente y su avance al siguiente, como lo ve en "Mi cuenta". */
export function ProgresoNivel({ titulo, detalle, progresoPct, pie, tono }: PropsProgresoNivel) {
  const avance = Math.min(100, Math.max(0, progresoPct));
  return (
    <div className="ui-progreso-nivel">
      <div className="ui-progreso-nivel__cabecera">
        <span className="ui-progreso-nivel__titulo">
          <PuntoNivel tono={tono} />
          {titulo}
        </span>
        {detalle ? <span className="ui-progreso-nivel__detalle">{detalle}</span> : null}
      </div>
      <div
        className="ui-progreso-nivel__barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={avance}
      >
        <span
          className={`ui-progreso-nivel__avance ui-progreso-nivel__avance--${tono}`}
          style={{ inlineSize: `${avance}%` }}
        />
      </div>
      <p className="ui-progreso-nivel__pie">{pie}</p>
    </div>
  );
}
