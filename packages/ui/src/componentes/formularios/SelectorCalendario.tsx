"use client";

import { useId, useRef, useState } from "react";

import {
  aIso,
  DIAS_SEMANA,
  desdeIso,
  hoyIso,
  moverMes,
  semanasDelMes,
} from "@appweb/core/calendario";

import { MESES } from "../../datos/fechas";
import { IconoCalendario, IconoFlechaDerecha, IconoFlechaIzquierda } from "../../iconos";
import { claseEtiquetaOculta, type EtiquetaOculta } from "../base/claseEtiqueta";
import { useCierreDesplegable } from "./useCierreDesplegable";

import "../estilos.css";
import "./selector-calendario.css";

export interface PropsSelectorCalendario {
  id: string;
  etiqueta: string;
  /** Fecha ISO "aaaa-mm-dd", o "" si no hay ninguna elegida. */
  valor: string;
  onCambio: (valor: string) => void;
  /** Texto del boton cuando no hay fecha. Por defecto, repite `etiqueta`. */
  placeholder?: string;
  /** Ultima fecha elegible (ISO). Por defecto, hoy: no se eligen dias futuros. */
  maximo?: string;
  /** Primera fecha elegible (ISO). */
  minimo?: string;
  /** Con fecha elegida, ofrece "Quitar fecha" en el pie del calendario. */
  limpiable?: boolean;
  /** Hacia que lado se abre el calendario; "fin" para un selector pegado al borde derecho. */
  alineacion?: "inicio" | "fin";
  disabled?: boolean;
  etiquetaOculta?: EtiquetaOculta;
}

/** "21 oct 2026": corto, para caber en el boton. */
function enTexto(iso: string): string {
  const fecha = desdeIso(iso);
  if (fecha === null) return "";
  const mes = (MESES[fecha.getMonth()] ?? "").slice(0, 3).toLowerCase();
  return `${fecha.getDate()} ${mes} ${fecha.getFullYear()}`;
}

/**
 * Elegir un dia concreto en un calendario de mes: un boton que abre la
 * cuadricula, con flechas para cambiar de mes. No se pueden elegir dias
 * futuros salvo que se indique otro `maximo`.
 *
 * Es para un dia puntual y reciente (un reporte, un filtro). Para una fecha
 * lejana, como un cumpleaños, `SelectorFecha` (dia, mes y año) es mas rapido.
 * Se opera con teclado: Tab recorre los dias y Escape lo cierra.
 */
export function SelectorCalendario({
  id,
  etiqueta,
  valor,
  onCambio,
  placeholder,
  maximo,
  minimo,
  limpiable = false,
  alineacion = "inicio",
  disabled,
  etiquetaOculta,
}: PropsSelectorCalendario) {
  const hoy = hoyIso();
  const tope = maximo ?? hoy;
  const elegida = desdeIso(valor);

  const [abierto, setAbierto] = useState(false);
  // El mes que se ve: el de la fecha elegida, o el actual.
  const base = elegida ?? new Date();
  const [vista, setVista] = useState({ anio: base.getFullYear(), mes: base.getMonth() + 1 });
  const contenedorRef = useRef<HTMLDivElement>(null);
  const panelId = `${useId()}-calendario`;

  useCierreDesplegable(abierto, contenedorRef, setAbierto);

  function abrir() {
    const punto = elegida ?? new Date();
    setVista({ anio: punto.getFullYear(), mes: punto.getMonth() + 1 });
    setAbierto(true);
  }

  function elegir(iso: string) {
    onCambio(iso);
    setAbierto(false);
  }

  const semanas = semanasDelMes(vista.anio, vista.mes);
  const isoDe = (dia: number) => aIso(new Date(vista.anio, vista.mes - 1, dia));
  const fueraDeRango = (iso: string) => iso > tope || (minimo !== undefined && iso < minimo);
  const puedeAdelantar =
    aIso(
      new Date(
        moverMes(vista.anio, vista.mes, 1).anio,
        moverMes(vista.anio, vista.mes, 1).mes - 1,
        1,
      ),
    ) <= tope;
  const puedeRetroceder =
    minimo === undefined || aIso(new Date(vista.anio, vista.mes - 1, 1)) > minimo;

  const clasePanel =
    alineacion === "fin"
      ? "ui-selector-calendario__panel ui-selector-calendario__panel--fin"
      : "ui-selector-calendario__panel";

  return (
    <div className="ui-campo ui-campo--calendario">
      <label htmlFor={id} className={claseEtiquetaOculta(etiquetaOculta)}>
        {etiqueta}
      </label>
      <div className="ui-selector-calendario" ref={contenedorRef}>
        <button
          type="button"
          id={id}
          className="ui-selector-calendario__disparador"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={abierto}
          aria-controls={abierto ? panelId : undefined}
          onClick={() => (abierto ? setAbierto(false) : abrir())}
        >
          <IconoCalendario tamano={20} />
          <span className={elegida ? undefined : "ui-selector-calendario__vacio"}>
            {elegida ? enTexto(valor) : (placeholder ?? etiqueta)}
          </span>
        </button>

        {abierto ? (
          <div id={panelId} className={clasePanel} role="dialog" aria-label={etiqueta}>
            <div className="ui-selector-calendario__cabecera">
              <button
                type="button"
                className="ui-selector-calendario__mes-boton"
                aria-label="Mes anterior"
                disabled={!puedeRetroceder}
                onClick={() => setVista((v) => moverMes(v.anio, v.mes, -1))}
              >
                <IconoFlechaIzquierda tamano={14} />
              </button>
              <span className="ui-selector-calendario__titulo" aria-live="polite">
                {MESES[vista.mes - 1]} {vista.anio}
              </span>
              <button
                type="button"
                className="ui-selector-calendario__mes-boton"
                aria-label="Mes siguiente"
                disabled={!puedeAdelantar}
                onClick={() => setVista((v) => moverMes(v.anio, v.mes, 1))}
              >
                <IconoFlechaDerecha tamano={14} />
              </button>
            </div>

            <div className="ui-selector-calendario__cuadricula">
              {DIAS_SEMANA.map((dia, indice) => (
                <span
                  // L y M se repiten: la posicion identifica el dia.
                  // biome-ignore lint/suspicious/noArrayIndexKey: lista fija de siete.
                  key={indice}
                  className="ui-selector-calendario__dia-semana"
                  aria-hidden="true"
                >
                  {dia}
                </span>
              ))}
              {semanas.flat().map((dia, indice) => {
                if (dia === null) {
                  // biome-ignore lint/suspicious/noArrayIndexKey: hueco fijo de la cuadricula.
                  return <span key={`hueco-${indice}`} />;
                }
                const iso = isoDe(dia);
                const clases = ["ui-selector-calendario__dia"];
                if (iso === valor) clases.push("ui-selector-calendario__dia--elegido");
                if (iso === hoy) clases.push("ui-selector-calendario__dia--hoy");
                return (
                  <button
                    key={iso}
                    type="button"
                    className={clases.join(" ")}
                    disabled={fueraDeRango(iso)}
                    aria-pressed={iso === valor}
                    aria-label={`${dia} de ${(MESES[vista.mes - 1] ?? "").toLowerCase()} de ${vista.anio}`}
                    onClick={() => elegir(iso)}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>

            <div className="ui-selector-calendario__pie">
              <button
                type="button"
                className="ui-selector-calendario__accion"
                disabled={fueraDeRango(hoy)}
                onClick={() => elegir(hoy)}
              >
                Hoy
              </button>
              {limpiable && valor !== "" ? (
                <button
                  type="button"
                  className="ui-selector-calendario__accion"
                  onClick={() => elegir("")}
                >
                  Quitar fecha
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
